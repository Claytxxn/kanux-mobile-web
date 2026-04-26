"use client";

import { useCallback, useEffect, useState } from "react";
import LoginForm from "@/components/LoginForm";
import MediaPreviewDialog from "@/components/MediaPreviewDialog";
import apiClient from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

const TICKET_IMAGE_PREFIX = "[image]:";

interface Ticket {
  id: string;
  number?: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  created_by?: string | null;
  company_id: string;
}

interface Comment {
  id: string;
  ticket_id: string;
  user_profile_id: string;
  content: string;
  created_at: string;
  user_profile?: {
    id?: string;
    display_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
}

function getImageUrlFromComment(content?: string | null) {
  if (!content || !content.startsWith(TICKET_IMAGE_PREFIX)) {
    return null;
  }
  return content.replace(TICKET_IMAGE_PREFIX, "").trim() || null;
}

function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case "OPEN":
      return "bg-blue-100 text-blue-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-700";
    case "CLOSED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getPriorityColor(priority: string) {
  switch (priority?.toUpperCase()) {
    case "HIGH":
      return "bg-red-100 text-red-700";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700";
    case "LOW":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusLabel(status: string) {
  switch (status?.toUpperCase()) {
    case "OPEN":
      return "Aberto";
    case "PENDING":
      return "Pendente";
    case "RESOLVED":
      return "Resolvido";
    case "CLOSED":
      return "Fechado";
    default:
      return status;
  }
}

function getPriorityLabel(priority: string) {
  switch (priority?.toUpperCase()) {
    case "HIGH":
      return "Alta";
    case "MEDIUM":
      return "Média";
    case "LOW":
      return "Baixa";
    default:
      return priority;
  }
}

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const appendComment = useCallback((comment: Comment) => {
    setComments((current) => {
      if (current.some((item) => item.id === comment.id)) {
        return current;
      }
      return [...current, comment].sort(
        (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
      );
    });
  }, []);

  const loadComments = useCallback(async () => {
    if (!ticketId) return;
    try {
      const commentsResult = await apiClient.getTicketComments(ticketId);
      if (commentsResult.success && Array.isArray(commentsResult.data)) {
        setComments(commentsResult.data as Comment[]);
      }
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
    }
  }, [ticketId]);

  useEffect(() => {
    let mounted = true;
    let authListener: any = null;

    const loadTicket = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(currentSession ?? null);

        if (!currentSession || !ticketId) {
          setLoading(false);
          return;
        }

        const ticketResult = await apiClient.getTickets(undefined, ticketId);

        if (!mounted) return;

        if (ticketResult.success) {
          setTicket(ticketResult.data as Ticket);
        }

        await loadComments();
      } catch (error) {
        console.error("Erro ao carregar ticket:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    authListener = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession ?? null);
    });

    loadTicket();

    return () => {
      mounted = false;
      authListener?.data?.subscription?.unsubscribe?.();
      authListener?.data?.unsubscribe?.();
    };
  }, [loadComments, ticketId]);

  useEffect(() => {
    if (!ticketId) return;
    const interval = window.setInterval(() => {
      void loadComments();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadComments, ticketId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert("Comentário não pode estar vazio");
      return;
    }

    setSavingComment(true);
    try {
      const result = await apiClient.addTicketComment(ticketId, newComment.trim());
      if (!result.success) {
        alert("Erro ao adicionar comentário");
        return;
      }
      if (result.data) {
        appendComment(result.data as Comment);
      }
      setNewComment("");
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setSavingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const result = await apiClient.updateTicket({ id: ticketId, status: newStatus });
      if (result.success && result.data) {
        setTicket(result.data as Ticket);
        setEditingStatus(null);
      }
    } catch (error: any) {
      alert("Erro: " + error.message);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      const result = await apiClient.updateTicket({ id: ticketId, priority: newPriority });
      if (result.success && result.data) {
        setTicket(result.data as Ticket);
        setEditingPriority(null);
      }
    } catch (error: any) {
      alert("Erro: " + error.message);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <LoginForm />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-lg text-slate-600">Ticket não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <a href="/tickets" className="mb-4 inline-block text-blue-600 hover:underline">
              ← Voltar para Tickets
            </a>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              {ticket.number ? (
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  {ticket.number}
                </span>
              ) : null}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                {getStatusLabel(ticket.status)}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                {getPriorityLabel(ticket.priority)}
              </span>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-slate-900">{ticket.title}</h1>
            <p className="mb-6 text-slate-600">{ticket.description}</p>
          </div>

          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Status</p>
                {editingStatus ? (
                  <select
                    value={editingStatus}
                    onChange={(event) => handleStatusChange(event.target.value)}
                    className="rounded border border-gray-300 px-4 py-2"
                  >
                    <option value="OPEN">Aberto</option>
                    <option value="PENDING">Pendente</option>
                    <option value="RESOLVED">Resolvido</option>
                    <option value="CLOSED">Fechado</option>
                  </select>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingStatus(ticket.status)}
                    className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(ticket.status)}`}
                  >
                    {getStatusLabel(ticket.status)}
                  </button>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Prioridade</p>
                {editingPriority ? (
                  <select
                    value={editingPriority}
                    onChange={(event) => handlePriorityChange(event.target.value)}
                    className="rounded border border-gray-300 px-4 py-2"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                  </select>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingPriority(ticket.priority)}
                    className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getPriorityColor(ticket.priority)}`}
                  >
                    {getPriorityLabel(ticket.priority)}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Comentários ({comments.length})</h2>

            <div className="mb-8">
              <textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                placeholder="Deixe um comentário..."
                rows={4}
                className="mb-3 w-full rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={savingComment}
                className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {savingComment ? "Salvando..." : "Comentar"}
              </button>
            </div>

            {comments.length === 0 ? (
              <p className="py-8 text-center text-slate-600">Nenhum comentário ainda</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => {
                  const imageUrl = getImageUrlFromComment(comment.content);
                  return (
                    <div key={comment.id} className="rounded-2xl bg-slate-50 p-4">
                      <p className="mb-1 text-sm font-semibold text-slate-900">
                        {comment.user_profile?.display_name || "Anônimo"}
                      </p>
                      <p className="mb-2 text-xs text-slate-500">
                        {new Date(comment.created_at).toLocaleDateString("pt-BR")} {new Date(comment.created_at).toLocaleTimeString("pt-BR")}
                      </p>

                      {imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(imageUrl)}
                          className="overflow-hidden rounded-2xl border border-slate-200"
                        >
                          <img src={imageUrl} alt="Imagem do comentário" className="max-h-80 w-full object-cover" />
                        </button>
                      ) : (
                        <p className="whitespace-pre-wrap text-slate-700">{comment.content}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaPreviewDialog
        open={!!previewImageUrl}
        type="image"
        url={previewImageUrl}
        name="Imagem do ticket"
        onClose={() => setPreviewImageUrl(null)}
      />
    </>
  );
}
