"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import Sidebar from "@/components/Sidebar";

interface TicketRow {
  id: string;
  number: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  creator_profile_id: string | null;
  company_id: string;
}

interface DepartmentRow {
  id: string;
  name: string;
  slug: string;
}

interface AllTicketRow {
  id: string;
  number: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  creator_profile_id: string | null;
  company_id: string;
  company_name?: string;
}

function TicketsPageContent() {
  const params = useSearchParams();
  const companyIdParam = params?.get("companyId");
  
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [allTickets, setAllTickets] = useState<AllTicketRow[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCompanyId, setActiveCompanyId] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    department_id: "",
  });
  const [savingTicket, setSavingTicket] = useState(false);

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
        setSession(s);

        if (s?.user) {
          const { data: p } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("auth_user_id", s.user.id)
            .single();
          if (!mounted) return;
          setProfile(p);

          const qpCompanyId = companyIdParam || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("companyId") : null) || "";
          
          if (p?.is_super_admin) {
            const { data: allCompanies } = await supabase
              .from("companies")
              .select("id, name, slug")
              .order("created_at", { ascending: false });
            if (!mounted) return;
            setCompanies(allCompanies || []);
            
            await loadAllTickets();
            
            if (qpCompanyId) {
              setActiveCompanyId(qpCompanyId);
            } else if (allCompanies && allCompanies.length > 0) {
              setActiveCompanyId(allCompanies[0].id);
            }
          } else if (qpCompanyId) {
            setActiveCompanyId(qpCompanyId);
          } else if (p?.id) {
            const { data: memberships } = await supabase
              .from("company_members")
              .select("company_id")
              .eq("user_profile_id", p.id)
              .limit(1);
            if (!mounted) return;
            if (memberships && memberships.length > 0) {
              setActiveCompanyId(memberships[0].company_id);
            }
          }
        }
        if (mounted) setLoading(false);
      } catch (e) {
        console.error('Auth init error:', e);
        if (mounted) setLoading(false);
      }
    };

    authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session) {
        setSession(session);
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
  }, []);

  const loadAllTickets = async () => {
    const { data: ticketsData } = await supabase
      .from("tickets")
      .select(`
        id, number, title, description, status, priority, created_at, creator_profile_id, company_id,
        companies!inner(name)
      `)
      .order("created_at", { ascending: false });

    if (ticketsData) {
      setAllTickets(ticketsData.map((t: any) => ({
        ...t,
        company_name: t.companies?.name || 'Empresa'
      })));
    }
  };

  useEffect(() => {
    if (!activeCompanyId || !session) return;

    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select("id, number, title, description, status, priority, created_at, creator_profile_id, company_id")
          .eq("company_id", activeCompanyId)
          .order("created_at", { ascending: false });
        if (error) console.error(error);
        if (mounted) setTickets(data || []);
      } catch (e) {
        console.error("Error fetching tickets:", e);
      }
    })();
    return () => { mounted = false };
  }, [activeCompanyId, session]);

  useEffect(() => {
    if (!activeCompanyId || !session) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("departments")
          .select("id, name, slug")
          .eq("company_id", activeCompanyId)
          .order("name", { ascending: true });
        if (error) console.error(error);
        if (mounted) setDepartments((data as any) || []);
      } catch (e) {
        console.error("Error fetching departments:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeCompanyId, session]);

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim()) {
      alert("Título é obrigatório");
      return;
    }
    if (!activeCompanyId || !profile?.id) {
      alert("Empresa ou perfil não localizado");
      return;
    }

    setSavingTicket(true);
    try {
      const payload = {
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        status: "OPEN",
        company_id: activeCompanyId,
        creator_profile_id: profile.id,
        department_id: newTicket.department_id || null,
      };
      const { data, error } = await supabase
        .from("tickets")
        .insert(payload)
        .select()
        .single();

      if (error) {
        alert("Erro ao criar ticket: " + error.message);
      } else if (data) {
        setTickets([data as TicketRow, ...tickets]);
        // Also add to allTickets if super admin
        if (profile?.is_super_admin) {
          const company = companies.find(c => c.id === activeCompanyId);
          setAllTickets([{ ...data, company_name: company?.name || 'Empresa' }, ...allTickets]);
        }
        setNewTicket({ title: "", description: "", priority: "MEDIUM", department_id: "" });
        setShowCreateForm(false);
      }
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setSavingTicket(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case "MEDIUM":
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case "LOW":
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case "IN_PROGRESS":
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case "CLOSED":
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  const isSuperAdmin = profile?.is_super_admin;
  const displayTickets = isSuperAdmin && !activeCompanyId ? allTickets : tickets;
  const currentCompanyName = companies.find(c => c.id === activeCompanyId)?.name || 'Empresa';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar currentCompanyId={activeCompanyId} />
      
      <main className="flex-1 p-6 pt-16 md:pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Chamados (Tickets)
              </h1>
              {isSuperAdmin && companies.length > 0 && (
                <p className="text-slate-400">Visualizando: {activeCompanyId ? currentCompanyName : 'Todas as empresas'}</p>
              )}
            </div>
            <div className="flex gap-3">
              {/* Company Selector for Super Admin */}
              {isSuperAdmin && companies.length > 0 && (
                <select
                  value={activeCompanyId || ""}
                  onChange={(e) => setActiveCompanyId(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                >
                  <option value="">Todas as empresas</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-900 font-semibold rounded-lg shadow-lg shadow-cyan-500/25 transition"
              >
                {showCreateForm ? "Cancelar" : "+ Novo Ticket"}
              </button>
            </div>
          </div>

          {showCreateForm && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-4">
                Criar Novo Ticket
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-400">
                    Dica: departamentos e chats podem ser criados/gerenciados no painel admin.
                  </p>
                  {profile?.is_super_admin && (
                    <a
                      href={`/admin?companyId=${activeCompanyId}`}
                      className="text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      Abrir Admin →
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    placeholder="Título do ticket"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Descreva o problema ou solicitação"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    >
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Departamento (opcional)
                    </label>
                    <select
                      value={newTicket.department_id}
                      onChange={(e) => setNewTicket({ ...newTicket, department_id: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    >
                      <option value="">Sem departamento</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCreateTicket}
                  disabled={savingTicket}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {savingTicket ? "Criando..." : "Criar Ticket"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {displayTickets.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">🎫</div>
                <p className="text-xl font-bold text-white mb-2">Nenhum ticket encontrado</p>
                <p className="text-slate-400">Crie um novo ticket para começar</p>
              </div>
            ) : (
              displayTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 hover:border-cyan-500/30 hover:bg-slate-800/50 transition"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-2">{ticket.title}</h3>
                      <p className="text-slate-400 mb-2 line-clamp-2">{ticket.description || "Sem descrição"}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-500">
                          {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        {isSuperAdmin && (ticket as any).company_name && (
                          <span className="text-cyan-400">🏢 {(ticket as any).company_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.toUpperCase() === "OPEN" ? "Aberto" : ticket.status.toUpperCase() === "IN_PROGRESS" ? "Em Progresso" : "Fechado"}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase() === "HIGH" ? "Alta" : ticket.priority.toUpperCase() === "MEDIUM" ? "Média" : "Baixa"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    }>
      <TicketsPageContent />
    </Suspense>
  );
}

