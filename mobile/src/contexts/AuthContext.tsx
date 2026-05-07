import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
// @ts-ignore
import NetInfo from '@react-native-community/netinfo';
import { Session, User } from '@supabase/supabase-js';
import {
  supabase,
  getUserProfile,
  getUserCompanies,
  getCompanyChats,
  getCompanyTickets,
  getDepartments,
  getChatMessages,
  Profile,
} from '../lib/supabase';
import {
  saveUserCompany,
  saveProfileOffline,
  getOfflineProfile,
  saveCompaniesOffline,
  saveChatsOffline,
  saveTicketsOffline,
  saveDepartmentsOffline,
  saveMessagesOffline,
  getUserCompany,
  updateLastSync,
} from '../lib/offlineStorage';
import { setAuthToken, setTokenProvider, initApi } from '../lib/api';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isOnline: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const retryTimer = useRef<any>(null);
  const userRef = useRef<User | null>(null);
  const previousOnlineRef = useRef<boolean | null>(null);
  const hadOfflineSessionRef = useRef(false);

  const preloadAfterLogin = async () => {
    if (!isOnline) return;
    try {
      const companies = await getUserCompanies();
      await saveCompaniesOffline(companies);

      if (companies.length === 0) return;

      const savedCompanyId = await getUserCompany();
      const activeCompany = companies.find(c => c.id === savedCompanyId) ?? companies[0];
      await saveUserCompany(activeCompany.id);

      const [tickets, chats, departments] = await Promise.all([
        getCompanyTickets(activeCompany.id),
        getCompanyChats(activeCompany.id),
        getDepartments(activeCompany.id),
      ]);

      await Promise.all([
        saveTicketsOffline(tickets, activeCompany.id),
        saveChatsOffline(activeCompany.id, chats),
        saveDepartmentsOffline(activeCompany.id, departments),
      ]);

      // Pré-carrega mensagens dos chats da empresa ativa para abrir telas sem atraso.
      await Promise.all(
        chats.map(async (chat) => {
          const messages = await getChatMessages(chat.id);
          await saveMessagesOffline(chat.id, messages);
        })
      );

      await updateLastSync();
    } catch (error) {
      console.error('Error preloading app data after login:', error);
    }
  };

  /** Load profile from backend; retries every 8s if backend returns nothing (e.g. 403 during deploy). */
  const loadProfile = async (sessionUser: User, attempt = 0) => {
    const profileData = await getUserProfile(sessionUser.id);
    if (profileData) {
      setProfile(profileData);
      // Salva perfil offline para uso quando sem internet
      saveProfileOffline(profileData).catch(() => {});
      try {
        const companies = await getUserCompanies();
        if (companies.length > 0) await saveUserCompany(companies[0].id);
      } catch { /* non-fatal */ }
    } else if (attempt === 0) {
      // Tenta carregar do cache offline enquanto backend não responde
      const cached = await getOfflineProfile();
      if (cached) {
        console.log('💾 Usando perfil do cache offline');
        setProfile(cached);
      }
      // Continua tentando em background
      const delay = 8000;
      console.warn(`⚠️ Profile unavailable, retry in ${delay / 1000}s (attempt ${attempt + 1}/5)`);
      retryTimer.current = setTimeout(() => loadProfile(sessionUser, attempt + 1), delay);
    } else if (attempt < 5) {
      // Backend might still be deploying — retry with backoff
      const delay = Math.min((attempt + 1) * 8000, 30000);
      console.warn(`⚠️ Profile unavailable, retry in ${delay / 1000}s (attempt ${attempt + 1}/5)`);
      retryTimer.current = setTimeout(() => loadProfile(sessionUser, attempt + 1), delay);
    }
  };

  const bootstrapSession = async (sessionUser: User) => {
    await loadProfile(sessionUser);
    preloadAfterLogin().catch((error) => {
      console.error('Error scheduling app preload after login:', error);
    });
  };

  const refreshProfile = async () => {
    if (!user) { setProfile(null); return; }
    await loadProfile(user);
  };

  const signOut = async () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    await supabase.auth.signOut();
    setAuthToken(null);
    setSession(null);
    setUser(null);
    setProfile(null);
    hadOfflineSessionRef.current = false;
  };

  useEffect(() => {
    // Kick off API URL detection early
    initApi().catch(() => {});

    // Register a token provider so every API request always uses the freshest token.
    // supabase.auth.getSession() automatically refreshes the access_token when near expiry.
    setTokenProvider(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });

    const unsubscribeNet = NetInfo.addEventListener((state: any) => {
      const onlineNow = state.isConnected ?? false;
      setIsOnline(onlineNow);

      if (previousOnlineRef.current === null) {
        previousOnlineRef.current = onlineNow;
        return;
      }

      const hadConnection = previousOnlineRef.current;
      const currentUser = userRef.current;

      if (currentUser && hadConnection && !onlineNow) {
        hadOfflineSessionRef.current = true;
      }

      if (currentUser && !hadConnection && onlineNow && hadOfflineSessionRef.current) {
        // Ao reconectar: NÃO forçar logout — manter sessão e apenas marcar para sync
        hadOfflineSessionRef.current = false;
        console.log('🔄 Reconectado — sessão mantida, sync será feito pelo SyncContext');
      }

      previousOnlineRef.current = onlineNow;
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      userRef.current = session?.user ?? null;

      if (session?.access_token) setAuthToken(session.access_token);

      if (session?.user) {
        bootstrapSession(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      setSession(session);
      setUser(session?.user ?? null);
      userRef.current = session?.user ?? null;
      setAuthToken(session?.access_token ?? null);

      if (session?.user) {
        setLoading(true);
        bootstrapSession(session.user).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      subscription.unsubscribe();
      unsubscribeNet();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, isOnline, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}