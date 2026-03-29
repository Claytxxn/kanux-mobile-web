"use client";
import LoginForm from "@/components/LoginForm";
import apiClient from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

interface Company {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}
interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  company_id: string;
  company_name?: string;
}
interface Department {
  id: string;
  name: string;
  slug: string;
}
interface Chat {
  id: string;
  name: string;
  is_private: boolean;
  department_id: string;
}
interface ChatMemberRow {
  id: string;
  chat_id: string;
  user_profile_id: string;
  user_profiles?: {
    id: string;
    display_name: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
}
interface AllTicketsRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  company_id: string;
  company_name: string;
  creator_name: string | null;
}

export default function AdminPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const companyIdParam = params?.get("companyId");

  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<AllTicketsRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", slug: "" });
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [newChat, setNewChat] = useState({ name: "", isPrivate: false, departmentId: "" });
  const [showCreateDepartment, setShowCreateDepartment] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: "", slug: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [chatMembers, setChatMembers] = useState<ChatMemberRow[]>([]);
  const [companyUserOptions, setCompanyUserOptions] = useState<{ id: string; display_name: string | null; email: string | null; }[]>([]);
  const [selectedUserProfileIdToAdd, setSelectedUserProfileIdToAdd] = useState<string>("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "MANAGER" | "ADMIN">("MEMBER");
  const [inviting, setInviting] = useState(false);

  const [globalStats, setGlobalStats] = useState({
    totalCompanies: 0,
    totalMembers: 0,
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    totalChats: 0,
    totalDepartments: 0
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const s = sessionData?.session;
        if (!mounted) return;
        setSession(s);

        if (s?.user) {
const profileResult = await apiClient.getProfile();
        if (!mounted) return;
        if (profileResult.success) {
          setProfile(profileResult.data);
        }

        if (!(profileResult.success && profileResult.data?.is_super_admin)) {
          setLoading(false);
          return;
        }

        const companiesResult = await apiClient.getAllCompanies();
        if (!mounted) return;
        if (companiesResult.success) {
          setCompanies(companiesResult.data || []);
          await loadGlobalStats(companiesResult.data || []);

          if (companyIdParam) {
            const company = (companiesResult.data || []).find((c: any) => c.id === companyIdParam);
            if (company) setCurrentCompany(company);
          }
        }

          if (companyIdParam) {
            const company = companiesData?.find(c => c.id === companyIdParam);
            if (company) setCurrentCompany(company);
          }
        }
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [companyIdParam]);

  const loadGlobalStats = async (companiesData: Company[]) => {
    try {
      const membersResult = await apiClient.getMembers();
      const allMembers = membersResult.success && Array.isArray(membersResult.data) ? membersResult.data : [];

      let allTickets: any[] = [];
      let allChatsCount = 0;
      let allDepartmentsCount = 0;

      await Promise.all(companiesData.map(async (company) => {
        const ticketsRes = await apiClient.getTickets(company.id);
        if (ticketsRes.success && Array.isArray(ticketsRes.data)) {
          allTickets = allTickets.concat(ticketsRes.data);
        }

        const chatsRes = await apiClient.getCompanyChats(company.id);
        if (chatsRes.success && Array.isArray(chatsRes.data)) {
          allChatsCount += chatsRes.data.length;
        }

        const departmentsRes = await apiClient.getDepartments(company.id);
        if (departmentsRes.success && Array.isArray(departmentsRes.data)) {
          allDepartmentsCount += departmentsRes.data.length;
        }
      }));

      setGlobalStats({
        totalCompanies: companiesData.length,
        totalMembers: allMembers.length,
        totalTickets: allTickets.length,
        openTickets: allTickets.filter(t => t.status === 'OPEN').length,
        closedTickets: allTickets.filter(t => t.status === 'CLOSED').length,
        totalChats: allChatsCount,
        totalDepartments: allDepartmentsCount
      });

      // Load all tickets with company info
      await loadAllTickets();
    } catch (e) {
      console.error('Error loading global stats:', e);
    }
  };

  const loadAllTickets = async () => {
    try {
      const allTicketsData: any[] = [];
      await Promise.all(companies.map(async (company) => {
        const ticketsRes = await apiClient.getTickets(company.id);
        if (ticketsRes.success && Array.isArray(ticketsRes.data)) {
          const companyTickets = ticketsRes.data.map((t: any) => ({
            ...t,
            company_name: company.name,
            creator_name: null,
          }));
          allTicketsData.push(...companyTickets);
        }
      }));

      setAllTickets(allTicketsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      console.error('Error loading all tickets:', e);
      setAllTickets([]);
    }
  };

  useEffect(() => {
    if (!currentCompany) return;
    loadCompanyData(currentCompany.id);
  }, [currentCompany]);

  const loadCompanyData = async (companyId: string) => {
    const membersRes = await apiClient.getCompanyMembers(companyId);
    if (membersRes.success && Array.isArray(membersRes.data)) {
      setMembers(membersRes.data);
      const opts = membersRes.data
        .map((m: any) => m.user_profiles)
        .filter(Boolean)
        .map((u: any) => ({ id: u.id, display_name: u.display_name ?? null, email: u.email ?? null }));
      setCompanyUserOptions(opts);
    } else {
      setMembers([]);
      setCompanyUserOptions([]);
    }

    const ticketsRes = await apiClient.getTickets(companyId);
    if (ticketsRes.success && Array.isArray(ticketsRes.data)) {
      setTickets(ticketsRes.data);
    } else {
      setTickets([]);
    }

    const deptsRes = await apiClient.getDepartments(companyId);
    if (deptsRes.success && Array.isArray(deptsRes.data)) {
      setDepartments(deptsRes.data);
    } else {
      setDepartments([]);
    }

    const chatsRes = await apiClient.getCompanyChats(companyId);
    if (chatsRes.success && Array.isArray(chatsRes.data)) {
      setChats(chatsRes.data);
    } else {
      setChats([]);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name || !newCompany.slug) {
      setMessage("Preencha todos os campos");
      return;
    }
    setSaving(true);
    setMessage("");

    try {
      const createdCompany = await apiClient.createCompany(newCompany.name, newCompany.slug.toLowerCase());
      if (!createdCompany.success) throw new Error(createdCompany.error || 'Erro ao criar empresa');

      if (profile) {
        await apiClient.addMember(createdCompany.data.id, profile.id, 'ADMIN');
      }

      await apiClient.createDepartment(createdCompany.data.id, 'Geral');
      await apiClient.createChat(createdCompany.data.id, 'geral', false);
      await apiClient.createChat(createdCompany.data.id, 'anuncios', false);
      await apiClient.createChat(createdCompany.data.id, 'admin', true);

      const companiesResult = await apiClient.getAllCompanies();
      if (companiesResult.success) {
        setCompanies(companiesResult.data || []);
        await loadGlobalStats(companiesResult.data || []);
      }

      setCurrentCompany(createdCompany.data);
      setShowCreateCompany(false);
      setNewCompany({ name: "", slug: "" });
      setMessage("Empresa criada com sucesso!");
    } catch (e: any) {
      setMessage("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChat = async () => {
    if (!currentCompany || !newChat.name) {
      setMessage("Preencha o nome do chat");
      return;
    }
    if (!session?.access_token) {
      setMessage("Sessão inválida. Faça login novamente.");
      return;
    }
    setSaving(true);
    setMessage("");

    try {
      const result = await apiClient.createChat(currentCompany.id, newChat.name.toLowerCase(), newChat.isPrivate, newChat.departmentId || undefined);
      if (!result.success) {
        setMessage("Erro: " + (result.error || 'Falha ao criar chat'));
        return;
      }

      setChats([...chats, result.data]);
      setShowCreateChat(false);
      setNewChat({ name: "", isPrivate: false, departmentId: "" });
      setMessage("Chat criado!");
    } catch (e: any) {
      setMessage("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!currentCompany || !newDepartment.name || !newDepartment.slug) {
      setMessage("Preencha nome e slug do departamento");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const result = await apiClient.createDepartment(currentCompany.id, newDepartment.name);
      if (!result.success) {
        setMessage("Erro: " + (result.error || 'Falha ao criar departamento'));
      } else {
        setDepartments([...(departments || []), result.data]);
        setNewDepartment({ name: "", slug: "" });
        setShowCreateDepartment(false);
        setMessage("Departamento criado!");
      }
    } catch (e: any) {
      setMessage("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const loadChatMembers = async (chatId: string) => {
    const { data, error } = await supabase
      .from("chat_members")
      .select("id, chat_id, user_profile_id, user_profiles(id, display_name, email, avatar_url)")
      .eq("chat_id", chatId);
    if (error) {
      setMessage("Erro ao carregar membros do chat: " + error.message);
      setChatMembers([]);
      return;
    }
    setChatMembers((data as any) || []);
  };

  const handleAddMemberToChat = async () => {
    if (!selectedChatId || !selectedUserProfileIdToAdd) {
      setMessage("Selecione um chat e um usuário");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const { error } = await supabase
        .from("chat_members")
        .insert({ chat_id: selectedChatId, user_profile_id: selectedUserProfileIdToAdd });
      if (error) throw error;
      await loadChatMembers(selectedChatId);
      setSelectedUserProfileIdToAdd("");
      setMessage("Membro adicionado ao chat!");
    } catch (e: any) {
      setMessage("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMemberFromChat = async (chatMemberId: string) => {
    if (!confirm("Remover este membro do chat?")) return;
    setSaving(true);
    setMessage("");
    try {
      const { error } = await supabase.from("chat_members").delete().eq("id", chatMemberId);
      if (error) throw error;
      if (selectedChatId) await loadChatMembers(selectedChatId);
      setMessage("Membro removido do chat!");
    } catch (e: any) {
      setMessage("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInviteUser = async () => {
    if (!currentCompany?.id) {
      setMessage("Selecione uma empresa");
      return;
    }
    if (!inviteEmail.trim()) {
      setMessage("Informe o email do usuário");
      return;
    }
    if (!session?.access_token) {
      setMessage("Sessão inválida. Faça login novamente.");
      return;
    }
    setInviting(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/invite-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          display_name: inviteDisplayName.trim() || null,
          company_id: currentCompany.id,
          role: inviteRole,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage("Erro: " + (json?.error || res.statusText));
        return;
      }
      setInviteEmail("");
      setInviteDisplayName("");
      setInviteRole("MEMBER");
      setMessage("Convite enviado por email!");
    } catch (e: any) {
      setMessage("Erro: " + e.message);
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("company_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      setMessage("Papel atualizado!");
    } catch (e: any) {
      setMessage("Erro: " + e.message);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro?")) return;
    if (!session?.access_token) {
      setMessage("Sessão inválida. Faça login novamente.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members?id=${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage("Erro: " + (json?.error || res.statusText));
        return;
      }
      setMembers(members.filter(m => m.id !== memberId));
      setMessage("Membro removido!");
    } catch (e: any) {
      setMessage("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolvido':
      case 'closed':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'em andamento':
      case 'open':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'pendente':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session || !profile?.is_super_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center">
                <span className="font-bold text-slate-900 text-lg">K</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Painel Super Admin</h1>
                <p className="text-xs text-slate-400">Gerenciamento Global</p>
              </div>
            </div>
          </div>
          <select
            value={currentCompany?.id || ""}
            onChange={(e) => {
              const company = companies.find(c => c.id === e.target.value);
              setCurrentCompany(company || null);
            }}
            className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          >
            <option value="">Todas as Empresas</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-800/50 rounded-xl">
          {[
            { id: "overview", label: "📊 Visão Geral", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
            { id: "alltickets", label: "🎫 Todos os Chamados", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { id: "companies", label: "🏢 Empresas", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
            { id: "departments", label: "📁 Departamentos", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
            { id: "chats", label: "💬 Chats", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
            { id: "chatMembers", label: "👥 Membros Chat", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
            { id: "members", label: "👤 Membros", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
            { id: "tickets", label: "🎫 Chamados", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
            { id: "users", label: "➕ Convidar", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 p-4 bg-cyan-500/20 border border-cyan-500/30 rounded-xl flex items-center gap-3 animate-pulse">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-cyan-400 font-medium">{message}</span>
          </div>
        )}

        {/* Overview Tab - GLOBAL STATS */}
        {activeTab === "overview" && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Visão Geral do Sistema</h2>
              <p className="text-slate-400">Estatísticas globais de todas as empresas</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-cyan-500/30 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{globalStats.totalCompanies}</p>
                    <p className="text-xs text-slate-400">Empresas</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-purple-500/30 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{globalStats.totalMembers}</p>
                    <p className="text-xs text-slate-400">Membros</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/30 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{globalStats.totalTickets}</p>
                    <p className="text-xs text-slate-400">Total Tickets</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-amber-500/30 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-400">{globalStats.openTickets}</p>
                    <p className="text-xs text-slate-400">Abertos</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-emerald-500/30 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">{globalStats.closedTickets}</p>
                    <p className="text-xs text-slate-400">Fechados</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-pink-500/30 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{globalStats.totalChats}</p>
                    <p className="text-xs text-slate-400">Chats</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{globalStats.totalDepartments}</p>
                    <p className="text-xs text-slate-400">Departamentos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Tickets from All Companies */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Chamados Recentes</h3>
                <button 
                  onClick={() => setActiveTab("alltickets")}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Ver todos →
                </button>
              </div>
              <div className="space-y-3">
                {allTickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{ticket.title}</p>
                      <p className="text-xs text-slate-400">{ticket.company_name}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(ticket.status)}`}>
                        {ticket.status === 'OPEN' ? 'Aberto' : ticket.status === 'CLOSED' ? 'Fechado' : ticket.status}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityClass(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                ))}
                {allTickets.length === 0 && (
                  <p className="text-center text-slate-400 py-8">Nenhum chamado encontrado</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All Tickets Tab */}
        {activeTab === "alltickets" && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Todos os Chamados</h2>
                <p className="text-slate-400">Visualize chamados de todas as empresas</p>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/50">
                      <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">Título</th>
                      <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">Empresa</th>
                      <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">Status</th>
                      <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">Prioridade</th>
                      <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {allTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-700/30 transition">
                        <td className="p-4">
                          <p className="font-medium text-white">{ticket.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{ticket.description || 'Sem descrição'}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-300">{ticket.company_name}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(ticket.status)}`}>
                            {ticket.status === 'OPEN' ? 'Aberto' : ticket.status === 'CLOSED' ? 'Fechado' : ticket.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityClass(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-400">
                          {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {allTickets.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <div className="text-6xl mb-4">🎫</div>
                  <p className="text-xl font-bold text-white mb-2">Nenhum chamado encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === "companies" && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Empresas</h2>
                <p className="text-slate-400">Gerencie todas as empresas do sistema</p>
              </div>
              <button
                onClick={() => setShowCreateCompany(!showCreateCompany)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-900 font-semibold rounded-lg shadow-lg shadow-cyan-500/25 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nova Empresa
              </button>
            </div>

            {showCreateCompany && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6 animate-scale-in">
                <h3 className="font-bold text-xl text-white mb-4">Criar Nova Empresa</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Nome da empresa"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" 
                  />
                  <input
                    value={newCompany.slug}
                    onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value })}
                    placeholder="Código (slug)"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" 
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCreateCompany}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-900 font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? "Criando..." : "Criar"}
                  </button>
                  <button
                    onClick={() => setShowCreateCompany(false)}
                    className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company, index) => (
                <div
                  key={company.id}
                  className={`bg-slate-800/30 border rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${
                    currentCompany?.id === company.id 
                      ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
                      : 'border-slate-700/50 hover:border-slate-600'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setCurrentCompany(company)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="font-bold text-white text-xl">
                        {company.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {currentCompany?.id === company.id && (
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-md border border-cyan-500/30">
                        Selecionada
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-white mb-1">{company.name}</h3>
                  <p className="text-sm text-slate-400 mb-3">@{company.slug}</p>
                  <p className="text-xs text-slate-500">
                    Criada em {new Date(company.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === "departments" && currentCompany && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Departamentos</h2>
                <p className="text-slate-400">{currentCompany.name}</p>
              </div>
              <button
                onClick={() => setShowCreateDepartment(!showCreateDepartment)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Novo Departamento
              </button>
            </div>

            {showCreateDepartment && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-xl text-white mb-4">Criar Departamento</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    placeholder="Nome do departamento"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" 
                  />
                  <input
                    value={newDepartment.slug}
                    onChange={(e) => setNewDepartment({ ...newDepartment, slug: e.target.value })}
                    placeholder="Slug (ex: suporte)"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" 
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleCreateDepartment} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg transition disabled:opacity-50">
                    {saving ? "Criando..." : "Criar"}
                  </button>
                  <button onClick={() => setShowCreateDepartment(false)} className="px-5 py-2.5 bg-slate-700 text-white font-semibold rounded-lg transition">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((d, index) => (
                <div key={d.id} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{d.name}</h3>
                      <p className="text-sm text-slate-400">@{d.slug}</p>
                    </div>
                  </div>
                </div>
              ))}
              {departments.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  <div className="text-6xl mb-4">📁</div>
                  <p className="text-xl font-bold text-white mb-2">Nenhum departamento</p>
                  <p>Crie o primeiro departamento para esta empresa</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "departments" && !currentCompany && (
          <div className="text-center py-12 text-slate-400 animate-fade-in">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-xl font-bold text-white mb-2">Selecione uma empresa</p>
            <p>Escolha uma empresa acima para gerenciar os departamentos</p>
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === "chats" && currentCompany && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Chats</h2>
                <p className="text-slate-400">{currentCompany.name}</p>
              </div>
              <button
                onClick={() => setShowCreateChat(!showCreateChat)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg shadow-pink-500/25 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Novo Chat
              </button>
            </div>

            {showCreateChat && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-xl text-white mb-4">Criar Novo Chat</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    value={newChat.name}
                    onChange={(e) => setNewChat({ ...newChat, name: e.target.value })}
                    placeholder="Nome do chat"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20" 
                  />
                  <select
                    value={newChat.departmentId}
                    onChange={(e) => setNewChat({ ...newChat, departmentId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  >
                    <option value="">Sem departamento</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-3 mt-4 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newChat.isPrivate}
                    onChange={(e) => setNewChat({ ...newChat, isPrivate: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-slate-600 bg-slate-900 checked:bg-pink-500 checked:border-pink-500" 
                  />
                  <span>Chat privado (apenas usuários selecionados)</span>
                </label>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCreateChat}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? "Criando..." : "Criar"}
                  </button>
                  <button
                    onClick={() => setShowCreateChat(false)}
                    className="px-5 py-2.5 bg-slate-700 text-white font-semibold rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chats.map((chat, index) => (
                <div key={chat.id} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                      {chat.is_private ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{chat.name}</h3>
                      <p className="text-sm text-slate-400">{chat.is_private ? "Privado" : "Público"}</p>
                    </div>
                  </div>
                </div>
              ))}
              {chats.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-xl font-bold text-white mb-2">Nenhum chat</p>
                  <p>Crie o primeiro chat para esta empresa</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "chats" && !currentCompany && (
          <div className="text-center py-12 text-slate-400 animate-fade-in">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-xl font-bold text-white mb-2">Selecione uma empresa</p>
            <p>Escolha uma empresa para gerenciar os chats</p>
          </div>
        )}

        {/* Chat Members Tab */}
        {activeTab === "chatMembers" && currentCompany && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Membros do Chat</h2>
              <p className="text-slate-400">{currentCompany.name}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
              <div className="grid md:grid-cols-3 gap-4">
                <select
                  value={selectedChatId}
                  onChange={async (e) => {
                    const next = e.target.value;
                    setSelectedChatId(next);
                    setChatMembers([]);
                    if (next) await loadChatMembers(next);
                  }}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500"
                >
                  <option value="">Selecione um chat</option>
                  {chats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.is_private ? "🔒 " : "# "}
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedUserProfileIdToAdd}
                  onChange={(e) => setSelectedUserProfileIdToAdd(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 disabled:opacity-50"
                  disabled={!selectedChatId}
                >
                  <option value="">Selecionar usuário para adicionar</option>
                  {companyUserOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name || u.email || u.id}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAddMemberToChat}
                  disabled={saving || !selectedChatId || !selectedUserProfileIdToAdd}
                  className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Adicionar ao chat"}
                </button>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase">Usuário</th>
                    <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase">Email</th>
                    <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {chatMembers.map((cm) => (
                    <tr key={cm.id} className="hover:bg-slate-700/30">
                      <td className="p-4 font-medium text-white">{cm.user_profiles?.display_name || cm.user_profiles?.id || cm.user_profile_id}</td>
                      <td className="p-4 text-slate-400">{(cm.user_profiles as any)?.email || "-"}</td>
                      <td>
                        <button
                          onClick={() => handleRemoveMemberFromChat(cm.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                          disabled={saving}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedChatId && chatMembers.length === 0 && (
                <div className="p-8 text-center text-slate-400">Nenhum membro encontrado para este chat</div>
              )}
              {!selectedChatId && (
                <div className="p-8 text-center text-slate-400">Selecione um chat para ver/gerenciar membros</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "chatMembers" && !currentCompany && (
          <div className="text-center py-12 text-slate-400 animate-fade-in">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-xl font-bold text-white mb-2">Selecione uma empresa</p>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && currentCompany && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Membros</h2>
              <p className="text-slate-400">{currentCompany.name}</p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase">Membro</th>
                    <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase">Email</th>
                    <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase">Papel</th>
                    <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {members.map(member => (
                    <tr key={member.id} className="hover:bg-slate-700/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                            {member.user_profiles?.display_name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="font-medium text-white">{member.user_profiles?.display_name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{member.user_profiles?.email || "-"}</td>
                      <td className="p-4">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-cyan-500"
                        >
                          <option value="MEMBER">Membro</option>
                          <option value="MANAGER">Gerente</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {members.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-xl font-bold text-white mb-2">Nenhum membro</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "members" && !currentCompany && (
          <div className="text-center py-12 text-slate-400 animate-fade-in">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-xl font-bold text-white mb-2">Selecione uma empresa</p>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === "tickets" && currentCompany && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Chamados</h2>
              <p className="text-slate-400">{currentCompany.name}</p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase">Título</th>
                    <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase">Status</th>
                    <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase">Prioridade</th>
                    <th className="text-left p-4 text-xs font-semibold text-cyan-400 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {tickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-slate-700/30">
                      <td className="p-4 font-medium text-white">{ticket.title}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tickets.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <div className="text-6xl mb-4">🎫</div>
                  <p className="text-xl font-bold text-white mb-2">Nenhum chamado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "tickets" && !currentCompany && (
          <div className="text-center py-12 text-slate-400 animate-fade-in">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-xl font-bold text-white mb-2">Selecione uma empresa</p>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && currentCompany && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Convidar Usuário</h2>
              <p className="text-slate-400">{currentCompany.name}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@empresa.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500" 
                />
                <input
                  value={inviteDisplayName}
                  onChange={(e) => setInviteDisplayName(e.target.value)}
                  placeholder="Nome (opcional)"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500" 
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500"
                >
                  <option value="MEMBER">Membro</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleInviteUser}
                  disabled={inviting}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {inviting ? "Enviando..." : "Enviar convite por email"}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Obs.: o envio do email depende do SMTP configurado no Supabase Auth.
              </p>
            </div>
          </div>
        )}

        {activeTab === "users" && !currentCompany && (
          <div className="text-center py-12 text-slate-400 animate-fade-in">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-xl font-bold text-white mb-2">Selecione uma empresa</p>
          </div>
        )}
      </div>
    </div>
  );
}

