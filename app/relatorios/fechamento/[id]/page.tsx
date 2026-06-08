"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft, Wallet, CheckCircle, Smartphone, Banknote, CreditCard, PackageOpen, Users } from "lucide-react";

export default function FechamentoRelatorioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [closing, setClosing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClosing = async () => {
      try {
        const res = await fetch(`/api/closing/${id}`);
        if (res.ok) {
          setClosing(await res.json());
        }
      } catch (error) {
        console.error("Erro ao buscar fechamento", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClosing();
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Carregando relatório...</div>;
  }

  if (!closing) {
    return <div className="p-8 text-center text-red-500 font-medium">Relatório não encontrado.</div>;
  }

  const itemsSummary = useMemo(() => {
    if (!closing?.transactions) return [];
    
    const summaryMap: Record<string, { name: string, quantity: number, unit?: string }> = {};
    
    closing.transactions.forEach((tx: any) => {
      if (!summaryMap[tx.productId]) {
        summaryMap[tx.productId] = { name: tx.product?.name || 'Produto', quantity: 0, unit: tx.product?.unit || 'un' };
      }
      summaryMap[tx.productId].quantity += tx.quantity;
    });
    
    return Object.values(summaryMap).sort((a, b) => b.quantity - a.quantity);
  }, [closing]);

  return (
    <main className="p-5 md:p-8 font-sans pb-28 md:pb-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button onClick={() => router.push('/')} className="p-3 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={() => window.print()} className="bg-slate-900 dark:bg-brand-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-bold transition-all active:scale-95">
          <Printer className="w-5 h-5" /> Imprimir Relatório
        </button>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none">
        {/* Cabeçalho do Relatório */}
        <div className="bg-brand-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-1">Fechamento de Caixa</h1>
          <p className="text-brand-100 font-medium opacity-90">
            {new Date(closing.createdAt).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-brand-200 mt-1">Hora do fechamento: {new Date(closing.createdAt).toLocaleTimeString('pt-BR')}</p>
        </div>

        {/* Resumo Faturamento */}
        <div className="p-6 md:p-8 space-y-8">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Resumo Financeiro</h3>
            <div className="bg-brand-50 dark:bg-brand-900/20 p-6 rounded-3xl border border-brand-100 dark:border-brand-800/30 text-center">
              <span className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">Faturamento Total do Dia</span>
              <p className="text-4xl font-black text-brand-700 dark:text-brand-300 mt-2">
                R$ {closing.totalRevenue.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Banknote className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Dinheiro</span>
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-white">R$ {closing.cashTotal.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Smartphone className="w-4 h-4" /> <span className="text-xs font-bold uppercase">PIX</span>
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-white">R$ {closing.pixTotal.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <CreditCard className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Cartão</span>
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-white">R$ {closing.cardTotal.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Users className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Conta Cliente</span>
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-white">R$ {closing.clientTotal ? closing.clientTotal.toFixed(2).replace('.', ',') : '0,00'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Métricas de Estoque</h3>
            
            {itemsSummary.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {itemsSummary.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{item.name}</span>
                    <span className="text-2xl font-black text-brand-600 dark:text-brand-400">{item.quantity} <span className="text-sm font-bold">{item.unit === 'UNIDADE' ? 'un' : item.unit === 'PACOTE' ? 'pct' : item.unit === 'METRO' ? 'm' : item.unit === 'LITRO' ? 'L' : item.unit === 'KG' ? 'kg' : ''}</span></span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-xl">
                  <PackageOpen className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Total de Produtos Vendidos</span>
              </div>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{closing.totalSales} <span className="text-sm text-slate-400">un</span></span>
            </div>

            {closing.transactions && closing.transactions.length > 0 && (
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4 font-bold">Produto</th>
                        <th className="p-4 font-bold text-center">Qtd</th>
                        <th className="p-4 font-bold">Pagamento</th>
                        <th className="p-4 font-bold text-right">Valor</th>
                        <th className="p-4 font-bold text-right">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {closing.transactions.map((tx: any) => (
                        <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{tx.product.name}</td>
                          <td className="p-4 font-black text-center">{tx.quantity}</td>
                          <td className="p-4">
                            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {tx.paymentMethod === 'CASH' && 'Dinheiro'}
                              {tx.paymentMethod === 'PIX' && 'PIX'}
                              {tx.paymentMethod === 'CARD' && 'Cartão'}
                              {tx.paymentMethod === 'CLIENT' && 'Conta Cliente'}
                              {tx.paymentMethod === 'SPLIT' && 'Múltiplo'}
                            </span>
                            {tx.paymentMethod === 'SPLIT' && (
                              <div className="text-[10px] text-slate-400 font-bold mt-1">
                                {tx.cashPrice > 0 && `DIN: R$${tx.cashPrice.toFixed(2).replace('.',',')} `}
                                {tx.pixPrice > 0 && `PIX: R$${tx.pixPrice.toFixed(2).replace('.',',')} `}
                                {tx.cardPrice > 0 && `CAR: R$${tx.cardPrice.toFixed(2).replace('.',',')} `}
                                {tx.clientPrice > 0 && `CLI: R$${tx.clientPrice.toFixed(2).replace('.',',')}`}
                              </div>
                            )}
                            {tx.customerId && tx.paymentMethod !== 'SPLIT' && (
                              <div className="text-[10px] text-brand-500 font-bold mt-1 truncate max-w-[120px]">
                                {tx.customer?.name || "Conta Cliente"}
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-bold text-right text-brand-600 dark:text-brand-400">
                            R$ {tx.price ? tx.price.toFixed(2).replace('.', ',') : '0,00'}
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-400 text-right">
                            {new Date(tx.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {closing.transactions && closing.transactions.length === 0 && (
              <div className="p-6 text-center text-slate-400 border border-slate-100 dark:border-slate-800 rounded-2xl">
                Nenhuma venda registrada neste dia.
              </div>
            )}
          </div>

        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase">Documento Gerado Eletronicamente via SOS Gás</p>
          <p className="text-[10px] text-slate-400 mt-1">{closing.id}</p>
        </div>
      </div>
    </main>
  );
}
