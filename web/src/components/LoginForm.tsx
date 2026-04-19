"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function LoginForm({ onSuccess, redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Verificar se usuário já está logado
  useEffect(() => {
    const checkSession = async () => {
      // Verificar token no localStorage
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
          apiClient.setToken(token);
          const result = await apiClient.getProfile();
          if (result.success) {
            if (onSuccess) onSuccess();
            else if (redirectTo) router.push(redirectTo);
          } else {
            // Token inválido, limpar
            apiClient.logout();
          }
        }
      }
    };
    checkSession();
  }, []);

  const signIn = async () => {
    setMessage("");
    if (!email || !password) {
      setMessage("Informe e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      const result = await apiClient.login(email, password);
      
      if (!result.success) {
        throw new Error(result.error || "Falha no login");
      }

      // Salvar token no localStorage
      if (typeof window !== 'undefined' && result.data?.token) {
        localStorage.setItem('auth_token', result.data.token);
      }

      setMessage("✓ Login realizado.");
      
      if (onSuccess) {
        onSuccess();
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push("/");
      }
      
      router.refresh();
    } catch (e: any) {
      setMessage("❌ " + (e?.message || "Falha no login"));
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    setMessage("");
    if (!email || !password) {
      setMessage("Informe e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      // O registro precisa ser feito via Supabase ou endpoint específico
      // Por agora, vamos mostrar mensagem para usar o login padrão
      setMessage("⚠️ Para criar conta, entre em contato com o administrador.");
    } catch (e: any) {
      setMessage("❌ " + (e?.message || "Falha no cadastro"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Logo + Título */}
      <div className="text-center mb-8 animate-slide-up delay-75">
        {/* Logo K com glow pulsante */}
        <div className="relative inline-flex items-center justify-center mb-5">
          {/* Anel de glow externo */}
          <span
            className="absolute inset-0 rounded-2xl animate-pulse-glow"
            style={{ background: "rgba(0,217,255,0.15)", filter: "blur(8px)", borderRadius: "16px" }}
            aria-hidden="true"
          />
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg"
            style={{
              background: "linear-gradient(135deg, #00D9FF 0%, #0099b8 100%)",
              boxShadow: "0 0 24px rgba(0,217,255,0.5), 0 8px 32px rgba(0,0,0,0.4)"
            }}>
            <span className="font-extrabold text-2xl" style={{ color: "#0A0A0F", letterSpacing: "-0.03em" }}>K</span>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Bem-vindo ao{" "}
          <span className="text-shimmer">Kanux</span>
        </h2>
        <p className="text-base" style={{ color: "var(--color-text-muted)" }}>
          Entre com sua conta para continuar
        </p>
      </div>

      {/* Card com borda gradiente + aurora */}
      <div
        className="aurora-bg animate-slide-up delay-150"
        style={{
          background: "rgba(18,18,26,0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(0,217,255,0.15)",
          borderRadius: "20px",
          padding: "2rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
          position: "relative",
        }}
      >
        <div className="space-y-5" style={{ position: "relative", zIndex: 1 }}>
          {/* Input Email */}
          <div className="animate-slide-up delay-200">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              E-mail
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              type="email"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl font-medium transition-all"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--color-text)",
                fontSize: "0.9375rem",
              }}
            />
          </div>

          {/* Input Senha */}
          <div className="animate-slide-up delay-300">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              Senha
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl font-medium transition-all"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--color-text)",
                fontSize: "0.9375rem",
              }}
              onKeyDown={(e) => { if (e.key === "Enter") signIn(); }}
            />
          </div>

          {/* Botão principal — shimmer no hover */}
          <button
            onClick={signIn}
            disabled={loading || !email || !password}
            className="btn btn-primary w-full py-3.5 text-base rounded-xl animate-slide-up delay-300"
            style={{ borderRadius: "12px" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner spinner-sm" style={{ borderTopColor: "#0A0A0F" }} />
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </button>

          {/* Divisor */}
          <div className="relative flex items-center gap-3 py-1 animate-slide-up delay-300">
            <div className="flex-1 line-glow" />
            <span className="text-sm px-1" style={{ color: "var(--color-text-muted)" }}>ou</span>
            <div className="flex-1 line-glow" />
          </div>

          {/* Botão secundário */}
          <button
            onClick={signUp}
            disabled={loading || !email || !password}
            className="btn btn-ghost w-full py-3.5 text-base rounded-xl animate-slide-up delay-500"
            style={{ borderRadius: "12px" }}
          >
            {loading ? "Aguarde..." : "Criar nova conta"}
          </button>
        </div>

        {/* Mensagem de status */}
        {message && (
          <div
            className={`mt-5 p-3 rounded-xl text-sm text-center animate-scale-in ${
              message.startsWith("✓")
                ? "badge-success"
                : message.startsWith("⚠️")
                ? "badge-warning"
                : "badge-error"
            }`}
            style={{
              background: message.startsWith("✓")
                ? "rgba(34,197,94,0.12)"
                : message.startsWith("⚠️")
                ? "rgba(245,158,11,0.12)"
                : "rgba(239,68,68,0.12)",
              border: `1px solid ${
                message.startsWith("✓")
                  ? "rgba(34,197,94,0.3)"
                  : message.startsWith("⚠️")
                  ? "rgba(245,158,11,0.3)"
                  : "rgba(239,68,68,0.3)"
              }`,
              borderRadius: "12px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {message}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <p className="text-center text-xs mt-6 animate-fade-in delay-500" style={{ color: "var(--color-text-muted)" }}>
        Plataforma segura · Kanux © {new Date().getFullYear()}
      </p>
    </div>
  );
}

