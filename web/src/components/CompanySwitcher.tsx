"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";

export default function CompanySwitcher({ currentCompanyId }: { currentCompanyId?: string }) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Carregar perfil
        const profileResult = await apiClient.getProfile();
        if (!mounted) return;
        
        if (profileResult.success && profileResult.data) {
          setProfile(profileResult.data);
          
          // Carregar empresas do usuário
          const companiesResult = await apiClient.getCompanies();
          if (!mounted) return;
          
          if (companiesResult.success && Array.isArray(companiesResult.data)) {
            setCompanies(companiesResult.data as any[]);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false };
  }, []);

  const current = companies.find(c => c.id === currentCompanyId) || companies[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 rounded flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium"
      >
        {current?.name || 'Empresa'}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded shadow-lg border border-gray-200 dark:border-slate-700 z-50">
          {companies.map(c => (
            <Link
              key={c.id}
              href={`/?companyId=${c.id}`}
              className={`block px-3 py-2 text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900 ${
                c.id === currentCompanyId ? 'bg-emerald-50 dark:bg-emerald-950 font-semibold' : ''
              }`}
              onClick={() => setOpen(false)}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

