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
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl shadow-lg shadow-cyan-500/30 mb-4">
          <span className="font-bold text-slate-900 text-2xl">K</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo ao Kanux</h2>
        <p className="text-slate-400">
          Entre com sua conta para continuar
        </p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              type="email"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
              onKeyDown={(e) => { if (e.key === 'Enter') signIn(); }}
            />
          </div>
          
          <button
            onClick={signIn}
            disabled={loading || !email || !password}
            className="w-full px-4 py-3.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-900 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800/50 text-slate-500">ou</span>
            </div>
          </div>
          
          <button
            onClick={signUp}
            disabled={loading || !email || !password}
            className="w-full px-4 py-3.5 bg-slate-700/50 border border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Aguarde..." : "Criar nova conta"}
          </button>
        </div>

        {message && (
          <div className={`mt-5 p-3 rounded-lg text-sm text-center ${
            message.startsWith("✓") 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
              : message.startsWith("⚠️")
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

