"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Flame, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Credenciais inválidas. Tente novamente.");
      setIsLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-blue-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 dark:border-slate-800">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <Flame className="w-10 h-10 text-brand-500 hidden" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">SOS Gás</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Painel de Acesso</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-bold text-center border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">E-mail de Acesso</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                className="w-full pl-11 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="funcionario@sosgas.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-11 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-5 mt-4 rounded-2xl text-xl font-bold text-white transition-all shadow-lg active:scale-[0.98] bg-brand-600 hover:bg-brand-700 shadow-brand-500/25 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 font-medium">
          Dúvidas? Fale com o administrador do sistema.
        </div>
      </div>
    </div>
  );
}
