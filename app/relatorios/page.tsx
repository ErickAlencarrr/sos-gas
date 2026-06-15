"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { FileText, Wallet, CalendarDays, ArrowRight, BarChart3, CalendarRange, RefreshCcw } from "lucide-react";

type DailyClosing = {
  id: string;
  date: string;
  totalSales: number;
  totalRevenue: number;
  pixTotal: number;
  cashTotal: number;
  cardTotal: number;
  sosTotal: number;
  createdAt: string;
};

export default function RelatoriosPage() {
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFixing, setIsFixing] = useState(false);
  const [viewMode, setViewMode] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  const router = useRouter();
  const { data: session } = useSession();

  const fetchClosings = async () => {
    try {
      const res = await fetch("/api/closing");
      if (res.ok) setClosings(await res.json());
    } catch (error) {
      console.error("Erro ao buscar fechamentos", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixOrphaned = async () => {
    setIsFixing(true);
    try {
      const res = await fetch('/api/admin/fix-orphaned', { method: 'POST' });
      const data = await res.json();
      if (data.fechados?.length > 0) {
        toast.success(data.mensagem);
        await fetchClosings();
      } else {
        toast.info(data.mensagem || 'Nenhum fechamento pendente encontrado.');
      }
    } catch {
      toast.error('Erro ao recuperar fechamentos pendentes.');
    } finally {
      setIsFixing(false);
    }
  };

  useEffect(() => { fetchClosings(); }, []);

  const groupedData = useMemo(() => {
    if (viewMode === "DAILY") return closings;

    const groups: Record<string, any> = {};

    closings.forEach(closing => {
      const date = new Date(closing.date);
      let key = "";

      if (viewMode === "MONTHLY") {
        key = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        // capitalizar primeira letra do mes
        key = key.charAt(0).toUpperCase() + key.slice(1);
      } else if (viewMode === "WEEKLY") {
        const firstDay = new Date(date);
        firstDay.setDate(date.getDate() - date.getDay());
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);
        key = `${firstDay.toLocaleDateString('pt-BR').slice(0, 5)} até ${lastDay.toLocaleDateString('pt-BR').slice(0, 5)}`;
      }

      if (!groups[key]) {
        groups[key] = {
          id: key,
          label: key,
          totalSales: 0,
          totalRevenue: 0,
          pixTotal: 0,
          cashTotal: 0,
          cardTotal: 0,
          sosTotal: 0,
          createdAt: closing.createdAt,
          count: 0
        };
      }

      groups[key].totalSales += closing.totalSales;
      groups[key].totalRevenue += closing.totalRevenue;
      groups[key].pixTotal += closing.pixTotal;
      groups[key].cashTotal += closing.cashTotal;
      groups[key].cardTotal += closing.cardTotal;
      groups[key].sosTotal += (closing.sosTotal || 0);
      groups[key].count += 1;
    });

    return Object.values(groups).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [closings, viewMode]);

  return (
    <main className="p-5 md:p-8 font-sans pb-28 md:pb-8 max-w-5xl mx-auto">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-brand-500" /> Relatórios de Caixa
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Histórico completo e agrupado do faturamento da empresa.</p>
        </div>
        {session?.user?.role === 'ADMIN' && (
          <button
            onClick={handleFixOrphaned}
            disabled={isFixing}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 rounded-2xl text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-60 whitespace-nowrap self-start"
          >
            <RefreshCcw className={`w-4 h-4 ${isFixing ? 'animate-spin' : ''}`} />
            {isFixing ? 'Recuperando...' : 'Recuperar dias pendentes'}
          </button>
        )}
      </header>

      {/* Tabs de Filtro */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8 w-full max-w-md mx-auto md:mx-0">
        <button 
          onClick={() => setViewMode("DAILY")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${viewMode === "DAILY" ? "bg-white dark:bg-slate-900 shadow-sm text-brand-600 dark:text-brand-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
        >
          <CalendarDays className="w-4 h-4" /> Diário
        </button>
        <button 
          onClick={() => setViewMode("WEEKLY")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${viewMode === "WEEKLY" ? "bg-white dark:bg-slate-900 shadow-sm text-brand-600 dark:text-brand-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
        >
          <CalendarRange className="w-4 h-4" /> Semanal
        </button>
        <button 
          onClick={() => setViewMode("MONTHLY")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${viewMode === "MONTHLY" ? "bg-white dark:bg-slate-900 shadow-sm text-brand-600 dark:text-brand-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
        >
          <BarChart3 className="w-4 h-4" /> Mensal
        </button>
      </div>

      {/* Versão Desktop (Tabela) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
              <th className="p-5 font-bold">{viewMode === "DAILY" ? "Data do Fechamento" : "Período"}</th>
              <th className="p-5 font-bold text-center">Faturamento Total</th>
              <th className="p-5 font-bold text-center">Produtos Vendidos</th>
              <th className="p-5 font-bold text-right">Ação / Detalhes</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">Carregando fechamentos...</td></tr>
            ) : groupedData.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
            ) : (
              groupedData.map((item: any) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-5 font-bold flex items-center gap-3 text-slate-800 dark:text-slate-200">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-xl">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      {viewMode === "DAILY" ? (
                        <>
                          {new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                          <div className="text-xs text-slate-400 font-medium">
                            Fechado às {new Date(item.createdAt).toLocaleTimeString('pt-BR')}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="capitalize">{item.label}</span>
                          <div className="text-xs text-slate-400 font-medium">
                            {item.count} fechamentos consolidados
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-5 font-black text-center text-lg text-brand-700 dark:text-brand-400">
                    R$ {item.totalRevenue.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-5 font-bold text-center text-slate-600 dark:text-slate-300">
                    {item.totalSales} un
                  </td>
                  <td className="p-5 text-right">
                    {viewMode === "DAILY" ? (
                      <button 
                        onClick={() => router.push(`/relatorios/fechamento/${item.id}`)}
                        className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold transition-all active:scale-95 inline-flex items-center gap-2"
                      >
                        Ver Detalhes <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="text-xs text-slate-400 font-bold px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-xl inline-block bg-slate-50 dark:bg-slate-900">
                        PIX: R$ {item.pixTotal.toFixed(2).replace('.',',')} | DIN: R$ {item.cashTotal.toFixed(2).replace('.',',')} | CAR: R$ {item.cardTotal.toFixed(2).replace('.',',')} | CLI: R$ {(item.clientTotal || 0).toFixed(2).replace('.',',')}
                      </div>
                    )}
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
        ) : groupedData.length === 0 ? (
          <div className="text-center text-slate-400 py-8">Nenhum registro encontrado.</div>
        ) : (
          groupedData.map((item: any) => (
            <div 
              key={item.id} 
              onClick={() => viewMode === "DAILY" && router.push(`/relatorios/fechamento/${item.id}`)}
              className={`bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all ${viewMode === "DAILY" ? "cursor-pointer active:scale-[0.98]" : ""}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-2xl">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    {viewMode === "DAILY" ? (
                      <>
                        <h4 className="font-bold text-slate-800 dark:text-white capitalize">
                          {new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </h4>
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(item.date).toLocaleDateString('pt-BR')} · Fechado às {new Date(item.createdAt).toLocaleTimeString('pt-BR')}
                        </span>
                      </>
                    ) : (
                      <>
                        <h4 className="font-bold text-slate-800 dark:text-white capitalize">
                          {item.label}
                        </h4>
                        <span className="text-xs font-bold text-brand-500">
                          {item.count} dias fechados
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-end bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-2">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Faturamento</span>
                  <span className="text-2xl font-black text-brand-600 dark:text-brand-400">R$ {item.totalRevenue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Vendas</span>
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{item.totalSales} un</span>
                </div>
              </div>

              {viewMode !== "DAILY" && (
                <div className="flex justify-between text-[10px] font-bold text-slate-500 px-2 mt-3 flex-wrap gap-1">
                  <span>PIX: R$ {item.pixTotal.toFixed(2).replace('.',',')}</span>
                  <span>DIN: R$ {item.cashTotal.toFixed(2).replace('.',',')}</span>
                  <span>CAR: R$ {item.cardTotal.toFixed(2).replace('.',',')}</span>
                  <span>SOS: R$ {(item.sosTotal || 0).toFixed(2).replace('.',',')}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
