"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import apiClient from "@/lib/apiClient";

interface SidebarProps {
  children?: React.ReactNode;
  currentCompanyId?: string;
}

export default function Sidebar({ children, currentCompanyId }: SidebarProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = (sessionData as any)?.session;
        if (!mounted) return;

        if (session?.user) {
          const profileResponse = await apiClient.getProfile();
          const profileData = profileResponse.data;
          if (!mounted) return;
          setProfile(profileData);

          const companiesResponse = await apiClient.getCompanies();
          if (!mounted) return;
          setCompanies(companiesResponse.data || []);
        }
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  // Fetch chats for current company
  useEffect(() => {
    if (!currentCompanyId) return;
    
    let mounted = true;
    (async () => {
      try {
        const chatsResponse = await apiClient.getCompanyChats(currentCompanyId);
        if (!mounted) return;
        setChats(chatsResponse.data || []);
      } catch (e) {
        console.error("Error fetching chats:", e);
      }
    })();
    return () => { mounted = false };
  }, [currentCompanyId]);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const hamburger = document.getElementById('hamburger-btn');
      if (sidebar && !sidebar.contains(event.target as Node) && 
          hamburger && !hamburger.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade-in"
          style={{ background: "rgba(5,5,8,0.75)", backdropFilter: "blur(4px)" }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Hamburger Button - Always visible */}
      <button
        id="hamburger-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #00D9FF 0%, #0099b8 100%)",
          boxShadow: isOpen ? "0 0 20px rgba(0,217,255,0.5), 0 4px 20px rgba(0,0,0,0.4)" : "0 0 12px rgba(0,217,255,0.3), 0 4px 16px rgba(0,0,0,0.3)",
          border: "1px solid rgba(0,217,255,0.5)",
        }}
        aria-label="Toggle menu"
      >
        <svg
          className="w-5 h-5 transition-transform duration-300"
          style={{ color: "#0A0A0F", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        id="sidebar"
        className="fixed top-0 left-0 h-screen flex flex-col z-50 w-80"
        style={{
          background: "linear-gradient(180deg, #111118 0%, #0d0d14 60%, #0a0a12 100%)",
          borderRight: "1px solid rgba(0,217,255,0.1)",
          boxShadow: isOpen ? "4px 0 32px rgba(0,0,0,0.6), 2px 0 12px rgba(0,217,255,0.06)" : "none",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 350ms cubic-bezier(0.16,1,0.3,1), box-shadow 350ms ease",
        }}
      >
        {/* Logo / Brand */}
        <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
            <div
              className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse-glow"
              style={{
                background: "linear-gradient(135deg, #00D9FF 0%, #0099b8 100%)",
                boxShadow: "0 0 16px rgba(0,217,255,0.4), 0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <span className="font-extrabold text-lg" style={{ color: "#0A0A0F", letterSpacing: "-0.02em" }}>K</span>
            </div>
            <div className="min-w-0">
              <span className="font-bold text-lg text-white tracking-tight">Kanux</span>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Plataforma SaaS</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Super Admin Badge */}
          {profile?.is_super_admin && (
            <div className="mb-4 px-3 py-2 rounded-xl animate-slide-in-left"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs font-semibold" style={{ color: "#F59E0B" }}>⭐ Super Admin</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Acesso completo</p>
            </div>
          )}

          {/* Empresas */}
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">
              🏢 Empresas
            </p>
            <ul className="space-y-1">
              {companies.map((company) => (
                <li key={company.id}>
                  <Link 
                    href={`/?companyId=${company.id}`}
                    onClick={() => setIsOpen(false)}
                    className={`sidebar-link ${currentCompanyId === company.id ? 'active' : ''}`}
                  >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: currentCompanyId === company.id ? "rgba(0,217,255,0.2)" : "rgba(255,255,255,0.06)" }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="font-medium truncate">{company.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Chats */}
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">
              💬 Chats
            </p>
            <ul className="space-y-1">
              {chats.length === 0 ? (
                <li className="px-3 py-3 text-sm text-slate-500 italic">Nenhum chat disponível</li>
              ) : (
                chats.slice(0, 5).map((chat) => (
                  <li key={chat.id}>
                    <Link 
                      href={`/chats?chatId=${chat.id}&companyId=${currentCompanyId}`}
                      onClick={() => setIsOpen(false)}
                      className={`sidebar-link ${
                        isActive(`/chats`) && pathname?.includes(chat.id) ? 'active' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                        {chat.is_private ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium truncate">{chat.name}</span>
                    </Link>
                  </li>
                ))
              )}
              {chats.length > 5 && (
                <li>
                  <Link 
                    href={`/chats?companyId=${currentCompanyId}`}
                    onClick={() => setIsOpen(false)}
                    className="sidebar-link"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                      <span className="text-xs font-bold">+{chats.length - 5}</span>
                    </div>
                    <span className="text-sm">Ver todos os chats ({chats.length})</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Tickets */}
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">
              🎫 Tickets
            </p>
            <ul className="space-y-1">
              <li>
                <Link 
                  href={currentCompanyId ? `/tickets?companyId=${currentCompanyId}` : '/tickets'}
                  onClick={() => setIsOpen(false)}
                  className={`sidebar-link ${isActive('/tickets') ? 'active' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive('/tickets') ? 'bg-white/20' : 'bg-slate-700'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <span className="font-medium">Ver Tickets</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin - only for admins */}
          {profile?.is_super_admin || profile?.role === 'ADMIN' ? (
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">
                ⚙️ Administração
              </p>
              <ul className="space-y-1">
                <li>
                  <Link 
                    href={currentCompanyId ? `/admin?companyId=${currentCompanyId}` : '/admin'}
                    onClick={() => setIsOpen(false)}
                    className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive('/admin') ? 'bg-white/20' : 'bg-slate-700'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">Painel Admin</span>
                  </Link>
                </li>
              </ul>
            </div>
          ) : null}
        </nav>

        {/* Profile Section */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
          <p className="text-xs font-bold uppercase tracking-wider px-3 mb-3" style={{ color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>
            👤 Conta
          </p>
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}
          >
            {loading ? (
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
            ) : profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #00D9FF, #0099b8)", color: "#0A0A0F" }}
              >
                {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-white truncate text-sm">
                {profile?.display_name || 'Carregando...'}
              </span>
              <span className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                {profile?.is_super_admin ? '⭐ Super Admin' : profile?.role || 'Membro'}
              </span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}

