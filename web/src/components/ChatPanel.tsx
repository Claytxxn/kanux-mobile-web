"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MediaPreviewDialog from "@/components/MediaPreviewDialog";
import apiClient from "@/lib/apiClient";

interface Message {
  id: string;
  chat_id: string;
  user_profile_id: string;
  content: string;
  message_type: string;
  media_url?: string | null;
  media_name?: string | null;
  attachments?: string;
  created_at: string;
  updated_at?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  user_profile?: {
    display_name?: string | null;
    avatar_url?: string | null;
  };
}

interface UserProfile {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface PreviewMedia {
  url: string;
  name?: string | null;
  type: "image" | "document";
}

function mergeMessages(current: Message[], incoming: Message[]) {
  const messageMap = new Map<string, Message>();
  current.forEach((message) => messageMap.set(message.id, message));
  incoming.forEach((message) => {
    const existing = messageMap.get(message.id);
    messageMap.set(message.id, existing ? { ...existing, ...message } : message);
  });
  return Array.from(messageMap.values()).sort(
    (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
  );
}

function getDisplayName(message: Message) {
  return message.display_name || message.user_profile?.display_name || "Usuário";
}

function groupMessagesByDate(messages: Message[]) {
  return messages.reduce<Record<string, Message[]>>((groups, message) => {
    const dateKey = new Date(message.created_at).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});
}

export default function ChatPanel({ chatId }: { chatId: string | null; onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const appendMessages = useCallback((incoming: Message[]) => {
    setMessages((current) => mergeMessages(current, incoming));
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const profileResult = await apiClient.getProfile();
        if (!mounted || !profileResult.success || !profileResult.data) {
          return;
        }

        const profileData = profileResult.data as UserProfile;
        setCurrentUser({
          id: profileData.id,
          display_name: profileData.display_name || "Usuário",
          avatar_url: profileData.avatar_url || null,
        });
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    let mounted = true;
    setMessages([]);

    const loadMessages = async () => {
      try {
        setLoadError(null);
        const messagesResult = await apiClient.getChatMessages(chatId);

        if (!mounted) return;

        if (messagesResult.success && Array.isArray(messagesResult.data)) {
          setMessages(mergeMessages([], messagesResult.data as Message[]));
        }
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error);
        if (mounted) {
          setLoadError("Não foi possível carregar o histórico deste chat.");
        }
      }
    };

    loadMessages();
    const interval = window.setInterval(loadMessages, 10000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const sendMessage = async () => {
    if (!chatId || !text.trim() || sending) return;

    const content = text.trim();
    setSending(true);
    setLoadError(null);

    try {
      setText("");

      const result = await apiClient.sendMessage(chatId, content, currentUser?.id);
      if (result.success && result.data) {
        appendMessages([result.data as Message]);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setText(content);
      setLoadError("A mensagem não foi enviada. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Hoje";
    if (date.toDateString() === yesterday.toDateString()) return "Ontem";
    return date.toLocaleDateString("pt-BR");
  };

  const renderMessageContent = (message: Message, isOwnMessage: boolean) => {
    const textClassName = isOwnMessage ? "text-white" : "text-gray-700";
    const caption = message.content?.trim();

    if (message.message_type === "image" && message.media_url) {
      return (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setPreviewMedia({ url: message.media_url as string, name: message.media_name, type: "image" })}
            className="overflow-hidden rounded-2xl border border-black/5 shadow-sm transition hover:scale-[1.01]"
          >
            <img src={message.media_url} alt={message.media_name || "Imagem"} className="max-h-80 w-full object-cover" />
          </button>
          {caption ? <p className={`text-sm whitespace-pre-wrap break-words ${textClassName}`}>{caption}</p> : null}
        </div>
      );
    }

    if (message.message_type === "document" && message.media_url) {
      return (
        <div className="space-y-3">
          {caption ? <p className={`text-sm whitespace-pre-wrap break-words ${textClassName}`}>{caption}</p> : null}
          <a
            href={message.media_url}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              isOwnMessage
                ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
            }`}
          >
            <div>
              <p className="text-sm font-semibold">{message.media_name || "Documento"}</p>
              <p className={`text-xs ${isOwnMessage ? "text-white/70" : "text-slate-500"}`}>Abrir PDF ou arquivo</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide">Abrir</span>
          </a>
        </div>
      );
    }

    if (message.message_type === "audio" && message.media_url) {
      return (
        <div className="space-y-3">
          {caption ? <p className={`text-sm whitespace-pre-wrap break-words ${textClassName}`}>{caption}</p> : null}
          <audio controls src={message.media_url} className="w-full max-w-xs" />
        </div>
      );
    }

    return <p className={`text-sm whitespace-pre-wrap break-words ${textClassName}`}>{message.content}</p>;
  };

  const sortedMessages = useMemo(() => mergeMessages([], messages), [messages]);
  const messageGroups = useMemo(() => groupMessagesByDate(sortedMessages), [sortedMessages]);

  if (!chatId) {
    return null;
  }

  return (
    <>
      <div className="flex h-full">
        <div className="flex min-w-0 flex-1 flex-col chat-window">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {loadError}
              </div>
            ) : null}

            {Object.entries(messageGroups).map(([dateKey, groupedMessages]) => (
              <div key={dateKey}>
                <div className="my-4 flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-medium text-gray-400">{formatDate(dateKey)}</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {groupedMessages.map((message) => {
                  const isOwnMessage = currentUser?.id === message.user_profile_id;
                  const authorName = getDisplayName(message);
                  const initial = authorName.charAt(0).toUpperCase();

                  return (
                    <div
                      key={message.id}
                      className={`group -mx-2 flex gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark font-semibold text-white shadow-sm">
                        {initial || "?"}
                      </div>

                      <div className={`min-w-0 flex-1 ${isOwnMessage ? "text-right" : ""}`}>
                        <div className={`flex items-baseline gap-2 ${isOwnMessage ? "justify-end" : ""}`}>
                          <span className="text-sm font-semibold text-gray-800">{authorName}</span>
                          <span className="text-xs text-gray-400">{formatTime(message.created_at)}</span>
                        </div>

                        <div
                          className={`chat-bubble inline-block max-w-[85%] ${
                            isOwnMessage ? "chat-bubble me" : "chat-bubble other"
                          }`}
                        >
                          {renderMessageContent(message, isOwnMessage)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="rounded-b-xl border-t border-gray-200 bg-white p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Mensagem..."
                  rows={1}
                  className="w-full resize-none bg-transparent px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
              </div>
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !text.trim()}
                className="rounded-lg bg-brand px-4 py-2 text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <MediaPreviewDialog
        open={!!previewMedia}
        type={previewMedia?.type ?? "image"}
        url={previewMedia?.url ?? null}
        name={previewMedia?.name}
        onClose={() => setPreviewMedia(null)}
      />
    </>
  );
}

