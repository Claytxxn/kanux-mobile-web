"use client";
import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

export default function TicketList({ companyId }: { companyId?: string | null }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    
    let mounted = true;
    setLoading(true);
    
    (async () => {
      const result = await apiClient.getTickets(companyId);
      if (!mounted) return;
      
      if (result.success && Array.isArray(result.data)) {
        setTickets(result.data);
      }
      setLoading(false);
    })();
    
    return () => { mounted = false };
  }, [companyId]);

  if (loading) {
    return <div className="p-4 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Chamados</h3>
      {tickets.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum chamado encontrado.</p>
      ) : (
        <ul className="space-y-2">
          {tickets.map(t => (
            <li key={t.id} className="border rounded p-2">
              <div className="text-sm text-gray-500">{t.number} • {t.priority}</div>
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-gray-600">{t.status}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

