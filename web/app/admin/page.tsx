"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoginForm from "@/components/LoginForm";
import AdminPageContent from "./Company";

function AdminPageLoader() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    let authListener: any = null;

    const initAuth = async () => {
      try {
        const { data: { session: sessionData }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Session error:', error);
        }
        
        const s = sessionData;

        if (!s?.user) {
          router.push("/login");
          return;
        }

        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*, is_super_admin")
          .eq("auth_user_id", s.user.id)
          .single();

        if (!mounted) return;
        setProfile(profileData);

        if (!profileData?.is_super_admin) {
          router.push("/");
          return;
        }

        if (mounted) setLoading(false);
      } catch (e) {
        console.error('Auth init error:', e);
        if (!mounted) return;
        if (mounted) setLoading(false);
        router.push("/login");
      }
    };

    authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session) {
        initAuth();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        router.push("/login");
      }
    });

    initAuth();

    return () => { 
      mounted = false;
      if (authListener && authListener.data && authListener.data.unsubscribe) {
        authListener.data.unsubscribe();
      }
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile?.is_super_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Acesso restrito a Super Admins</div>
      </div>
    );
  }

  return <AdminPageContent />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    }>
      <AdminPageLoader />
    </Suspense>
  );
}

