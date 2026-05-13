"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Wallet, CalendarDays, ArrowRight } from "lucide-react";

type DailyClosing = {
  id: string;
  date: string;
  totalSales: number;
  totalRevenue: number;
  pixTotal: number;
  cashTotal: number;
  cardTotal: number;
  createdAt: string;
};

export default function RelatoriosPage() {
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchClosings = async () => {
      try {
        const res = await fetch("/api/closing");
        if(res.ok) {
          const data = await res.json();
          setClosings(data);
        }
      } catch (error) {
        console.error("Erro ao buscar fechamentos", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClosings();
  }, []);

  return (
    <main className="p-5 md:p-8 font-sans pb-28 md:pb-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <FileText className="w-8 h-8 text-brand-500" /> Relatórios de Caixa
        </h2>
        <p className="text-slate-500 mt-2 font-medium">Histórico completo de todos os fechamentos de caixa realizados.</p>
      </header>

      {/* Versão Desktop (Tabela) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
              <th className="p-5 font-bold">Data do Fechamento</th>
              <th className="p-5 font-bold text-center">Faturamento Total</th>
              <th className="p-5 font-bold text-center">Produtos Vendidos</th>
              <th className="p-5 font-bold text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">Carregando fechamentos...</td></tr>
            ) : closings.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhum fechamento registrado ainda.</td></tr>
            ) : (
              closings.map((closing) => (
                <tr key={closing.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-5 font-bold flex items-center gap-3 text-slate-800 dark:text-slate-200">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-xl">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      {new Date(closing.createdAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                      <div className="text-xs text-slate-400 font-medium">
                        às {new Date(closing.createdAt).toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  </td>
                  <td className="p-5 font-black text-center text-lg text-brand-700 dark:text-brand-400">
                    R$ {closing.totalRevenue.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-5 font-bold text-center text-slate-600 dark:text-slate-300">
                    {closing.totalSales} un
                  </td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => router.push(`/relatorios/fechamento/${closing.id}`)}
                      className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold transition-all active:scale-95 inline-flex items-center gap-2"
                    >
                      Ver Detalhes <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Versão Mobile (Cards) */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="text-center text-slate-400 py-8">Carregando fechamentos...</div>
        ) : closings.length === 0 ? (
          <div className="text-center text-slate-400 py-8">Nenhum fechamento registrado ainda.</div>
        ) : (
          closings.map((closing) => (
            <div 
              key={closing.id} 
              onClick={() => router.push(`/relatorios/fechamento/${closing.id}`)}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-2xl">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white capitalize">
                      {new Date(closing.createdAt).toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </h4>
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(closing.createdAt).toLocaleDateString('pt-BR')} às {new Date(closing.createdAt).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-end bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Faturamento</span>
                  <span className="text-2xl font-black text-brand-600 dark:text-brand-400">R$ {closing.totalRevenue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Vendas</span>
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{closing.totalSales} un</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
