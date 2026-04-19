import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
// @ts-ignore
import NetInfo from '@react-native-community/netinfo';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserProfile, getUserCompanies, Profile } from '../lib/supabase';
import { saveUserCompany } from '../lib/offlineStorage';
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

  /** Load profile from backend; retries every 8s if backend returns nothing (e.g. 403 during deploy). */
  const loadProfile = async (sessionUser: User, attempt = 0) => {
    const profileData = await getUserProfile(sessionUser.id);
    if (profileData) {
      setProfile(profileData);
      try {
        const companies = await getUserCompanies();
        if (companies.length > 0) await saveUserCompany(companies[0].id);
      } catch { /* non-fatal */ }
    } else if (attempt < 5) {
      // Backend might still be deploying — retry with backoff
      const delay = Math.min((attempt + 1) * 8000, 30000);
      console.warn(`⚠️ Profile unavailable, retry in ${delay / 1000}s (attempt ${attempt + 1}/5)`);
      retryTimer.current = setTimeout(() => loadProfile(sessionUser, attempt + 1), delay);
    }
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
      setIsOnline(state.isConnected ?? false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.access_token) setAuthToken(session.access_token);

      if (session?.user) {
        loadProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      setSession(session);
      setUser(session?.user ?? null);
      setAuthToken(session?.access_token ?? null);

      if (session?.user) {
        loadProfile(session.user);
      } else {
        setProfile(null);
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