"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoginForm from "@/components/LoginForm";

interface Company {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface TicketStats {
  companyId: string;
  companyName: string;
  total: number;
  open: number;
  closed: number;
}

function HomeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const companyIdParam = params?.get("companyId");
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [ticketStats, setTicketStats] = useState<TicketStats[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    let authListener: any = null;

    const initAuth = async () => {
      try {
        // First try to get the session - this will refresh if needed
        const { data: { session: sessionData }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Session error:', error);
        }
        
        const s = sessionData;
        setSession(s);

        if (s?.user) {
          const { data: profileData } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("auth_user_id", s.user.id)
            .single();
          if (!mounted) return;
          setProfile(profileData);

          let userCompanies: any[] = [];
          if (profileData?.is_super_admin) {
            const { data: allCompanies } = await supabase
              .from("companies")
              .select("id, name, slug, created_at")
              .order("created_at", { ascending: false });
            userCompanies = allCompanies ? [...allCompanies] : [];
            
            // Load ticket stats for super admin
            if (profileData?.is_super_admin && allCompanies) {
              await loadTicketStats(allCompanies);
            }
          } else {
            const { data: memberships } = await supabase
              .from("company_members")
              .select("company_id, companies(id, name, slug)")
              .eq("user_profile_id", profileData?.id);
            userCompanies = (memberships || []).map((m: any) => m.companies).filter(Boolean);
          }
          if (!mounted) return;
          setCompanies(userCompanies);

          if (companyIdParam) {
            setCurrentCompanyId(companyIdParam);
          } else if (userCompanies.length > 0) {
            setCurrentCompanyId(userCompanies[0].id);
          }
        }
        setLoading(false);
      } catch (e) {
        console.error('Auth init error:', e);
        if (mounted) setLoading(false);
      }
    };

    // Set up auth listener to handle session changes
    authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        // Reinitialize auth when signed in
        initAuth();
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setCompanies([]);
      }
    });

    initAuth();

    return () => {
      mounted = false;
      if (authListener && authListener.data && authListener.data.unsubscribe) {
        authListener.data.unsubscribe();
      }
    };
  }, [companyIdParam]);

  const loadTicketStats = async (companiesList: Company[]) => {
    // Get all tickets
    const { data: allTickets } = await supabase
      .from("tickets")
      .select("id, status, company_id")
      .order("created_at", { ascending: false })
      .limit(20);

    // Get recent tickets with company info
    const { data: recentData } = await supabase
      .from("tickets")
      .select(`
        id, title, status, priority, created_at, company_id,
        companies!inner(name)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentData) {
      setRecentTickets(recentData.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        created_at: t.created_at,
        company_id: t.company_id,
        company_name: t.companies?.name || 'Empresa'
      })));
    }

    // Calculate stats per company
    const stats: TicketStats[] = companiesList.map(company => {
      const companyTickets = (allTickets || []).filter(t => t.company_id === company.id);
      return {
        companyId: company.id,
        companyName: company.name,
        total: companyTickets.length,
        open: companyTickets.filter(t => t.status === 'OPEN').length,
        closed: companyTickets.filter(t => t.status === 'CLOSED').length
      };
    });
    setTicketStats(stats);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </main>
    );
  }

  const currentCompany = companies.find((c) => c.id === currentCompanyId) || companies[0];
  const isSuperAdmin = profile?.is_super_admin;

  // Calculate global stats
  const globalStats = {
    totalCompanies: companies.length,
    totalTickets: ticketStats.reduce((sum, s) => sum + s.total, 0),
    openTickets: ticketStats.reduce((sum, s) => sum + s.open, 0),
    closedTickets: ticketStats.reduce((sum, s) => sum + s.closed, 0)
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center">
                <span className="font-bold text-slate-900 text-lg">K</span>
              </div>
              <span className="font-bold text-2xl text-white">Kanux</span>
            </div>
            {companies.length > 1 && (
              <select
                value={currentCompanyId}
                onChange={(e) => setCurrentCompanyId(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {profile?.display_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white">{profile?.display_name}</p>
                <p className="text-xs text-cyan-400">{isSuperAdmin ? "⭐ Super Admin" : profile?.role || "Membro"}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="p-2 hover:bg-slate-700 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Bem-vindo{currentCompany ? ` à ${currentCompany.name}` : ""}! 👋
          </h1>
          <p className="text-lg text-slate-400">O que você gostaria de fazer hoje?</p>
        </div>

        {/* Global Stats for Super Admin */}
        {isSuperAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 hover:border-cyan-500/30 transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{globalStats.totalCompanies}</p>
                  <p className="text-sm text-slate-400">Empresas</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 hover:border-purple-500/30 transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{globalStats.totalTickets}</p>
                  <p className="text-sm text-slate-400">Total Tickets</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 hover:border-amber-500/30 transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">{globalStats.openTickets}</p>
                  <p className="text-sm text-slate-400">Abertos</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 hover:border-emerald-500/30 transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{globalStats.closedTickets}</p>
                  <p className="text-sm text-slate-400">Fechados</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => router.push(`/chats?companyId=${currentCompanyId}`)}
            className="bg-slate-800/30 border border-slate-700/50 p-6 text-left rounded-xl hover:border-cyan-500/30 hover:scale-[1.02] transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Chats</h3>
            <p className="text-sm text-slate-400">Converse com sua equipe</p>
          </button>

          <button
            onClick={() => router.push(`/tickets?companyId=${currentCompanyId}`)}
            className="bg-slate-800/30 border border-slate-700/50 p-6 text-left rounded-xl hover:border-pink-500/30 hover:scale-[1.02] transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Chamados</h3>
            <p className="text-sm text-slate-400">Abra e acompanhe tickets</p>
          </button>

          <button
            onClick={() => router.push(`/profile`)}
            className="bg-slate-800/30 border border-slate-700/50 p-6 text-left rounded-xl hover:border-purple-500/30 hover:scale-[1.02] transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Meu Perfil</h3>
            <p className="text-sm text-slate-400">Edite suas informações</p>
          </button>

          {(isSuperAdmin || profile?.role === "ADMIN") && (
            <button
              onClick={() => router.push(`/admin?companyId=${currentCompanyId}`)}
              className="bg-slate-800/30 border border-slate-700/50 p-6 text-left rounded-xl hover:border-amber-500/30 hover:scale-[1.02] transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-white mb-1">Admin</h3>
              <p className="text-sm text-slate-400">Gerencie a empresa</p>
            </button>
          )}
        </div>

        {/* Super Admin: All Companies & Recent Tickets */}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All Companies */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Todas as Empresas</h2>
                <button
                  onClick={() => router.push(`/admin?companyId=${currentCompanyId}`)}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Gerenciar →
                </button>
              </div>
              <div className="space-y-3">
                {companies.map((company) => {
                  const stats = ticketStats.find(s => s.companyId === company.id);
                  return (
                    <div 
                      key={company.id} 
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 cursor-pointer transition"
                      onClick={() => setCurrentCompanyId(company.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="font-bold text-white">
                            {company.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{company.name}</p>
                          <p className="text-xs text-slate-400">@{company.slug}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{stats?.total || 0} tickets</p>
                        <p className="text-xs text-slate-400">{stats?.open || 0} abertos</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Chamados Recentes</h2>
                <button
                  onClick={() => router.push(`/admin?companyId=${currentCompanyId}&tab=alltickets`)}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Ver todos →
                </button>
              </div>
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 cursor-pointer transition"
                    onClick={() => router.push(`/tickets/${ticket.id}?companyId=${ticket.company_id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{ticket.title}</p>
                      <p className="text-xs text-slate-400">{ticket.company_name}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        ticket.status === 'OPEN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        ticket.status === 'CLOSED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {ticket.status === 'OPEN' ? 'Aberto' : ticket.status === 'CLOSED' ? 'Fechado' : ticket.status}
                      </span>
                    </div>
                  </div>
                ))}
                {recentTickets.length === 0 && (
                  <p className="text-center text-slate-400 py-8">Nenhum chamado encontrado</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Section for Non-Super Admin */}
        {!isSuperAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-2">Empresa Atual</p>
              <p className="text-2xl font-bold text-white">{currentCompany?.name || "Nenhuma"}</p>
            </div>
            
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-2">Seu Papel</p>
              <p className="text-2xl font-bold text-pink-400">
                {profile?.role === "ADMIN" ? "Administrador" : profile?.role === "MANAGER" ? "Gerente" : "Membro"}
              </p>
            </div>
            
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-2">Status</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                <span className="text-xl font-bold text-emerald-400">Ativo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

