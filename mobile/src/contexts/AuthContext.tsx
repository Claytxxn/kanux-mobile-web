import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// @ts-ignore
import NetInfo from '@react-native-community/netinfo';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserProfile, getUserCompanies, Profile } from '../lib/supabase';
import { saveUserCompany } from '../lib/offlineStorage';
import { setAuthToken } from '../lib/api'; // ← CORREÇÃO: sincroniza o token com o backend Java

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

  const refreshProfile = async () => {
    if (!user) { setProfile(null); return; }
    const profileData = await getUserProfile(user.id);
    setProfile(profileData);
    if (profileData) {
      const companies = await getUserCompanies();
      if (companies.length > 0) {
        await saveUserCompany(companies[0].id);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthToken(null); // ← limpa o token no backend Java também
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener((state: any) => {
      setIsOnline(state.isConnected ?? false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // ← CORREÇÃO: propaga o token existente para o backend Java
      if (session?.access_token) setAuthToken(session.access_token);

      if (session?.user) {
        getUserProfile(session.user.id).then(async (profileData) => {
          setProfile(profileData);
          if (profileData) {
            const companies = await getUserCompanies();
            if (companies.length > 0) {
              await saveUserCompany(companies[0].id);
            }
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // ← CORREÇÃO: atualiza o token no backend Java a cada mudança de sessão
      setAuthToken(session?.access_token ?? null);

      if (session?.user) {
        getUserProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => { subscription.unsubscribe(); unsubscribeNet(); };
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