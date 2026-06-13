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

  /** Load profile — cache first, then network if needed. */
  const loadProfile = async (sessionUser: User) => {
    // 1) Tenta cache offline primeiro
    const cached = await getOfflineProfile();
    if (cached) {
      setProfile(cached);
      return;
    }
    // 2) Se não tem cache, busca da rede
    try {
      const profileData = await getUserProfile(sessionUser.id);
      if (profileData) {
        setProfile(profileData);
        saveProfileOffline(profileData).catch(() => {});
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar perfil da rede:', error);
    }
  };

  const bootstrapSession = async (sessionUser: User) => {
    try {
      // Carrega perfil primeiro (prioridade máxima)
      await loadProfile(sessionUser);
      
      // Preload em background (não bloqueia o loading)
      preloadAfterLogin().catch((error) => {
        console.error('Error preloading app data:', error);
      });
    } catch (error) {
      console.error('[AuthContext] bootstrapSession error:', error);
    }
  };

  const refreshProfile = async () => {
    if (!user) { setProfile(null); return; }
    await loadProfile(user);
  };

  const signOut = async () => {
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
        bootstrapSession(session.user);
      }
      // Loading termina no finally do bootstrapSession ou imediatamente se não tiver user
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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