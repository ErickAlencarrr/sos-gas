"use client";

import { useEffect, useState } from "react";
import { ArrowUpCircle, ArrowDownCircle, Receipt, CheckCircle2, PackageOpen, FileText } from "lucide-react";

type Transaction = {
  id: string;
  type: "IN" | "OUT";
  quantity: number;
  createdAt: string;
  invoiceNumber?: string | null;
  hasBoleto?: boolean | null;
  isBoletoPaid?: boolean | null;
  product: {
    name: string;
    type: "GAS" | "WATER";
  };
};

export default function Relatorios() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/transactions/history");
        if(res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Erro ao buscar", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <main className="p-5 md:p-8 font-sans pb-28 md:pb-8">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <FileText className="w-8 h-8 text-brand-500" /> Relatórios
        </h2>
        <p className="text-slate-500 mt-2 font-medium">Histórico completo de Entradas e Saídas do estoque.</p>
      </header>

      {/* Versão Desktop (Tabela) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
              <th className="p-5 font-bold">Tipo</th>
              <th className="p-5 font-bold">Produto</th>
              <th className="p-5 font-bold text-center">Quantidade</th>
              <th className="p-5 font-bold">Detalhes da Nota</th>
              <th className="p-5 font-bold">Data/Hora</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Carregando...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-5 font-bold flex items-center gap-2">
                    {tx.type === 'IN' ? (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1"><ArrowUpCircle className="w-5 h-5"/> Entrada</span>
                    ) : (
                      <span className="text-brand-600 dark:text-brand-500 flex items-center gap-1"><ArrowDownCircle className="w-5 h-5"/> Venda</span>
                    )}
                  </td>
                  <td className="p-5 font-bold text-slate-700 dark:text-slate-200">{tx.product.name}</td>
                  <td className="p-5 font-black text-center text-lg">{tx.quantity}</td>
                  <td className="p-5">
                    {tx.type === 'IN' ? (
                      <div className="flex flex-col gap-1 text-xs">
                        {tx.invoiceNumber ? <span className="font-mono text-slate-500">NF: {tx.invoiceNumber}</span> : <span className="text-slate-400 italic">S/ Nota</span>}
                        {tx.hasBoleto && (
                          <span className={`inline-flex items-center gap-1 w-max px-2 py-0.5 rounded-full font-bold ${tx.isBoletoPaid ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30'}`}>
                            {tx.isBoletoPaid ? <CheckCircle2 className="w-3 h-3"/> : <Receipt className="w-3 h-3"/>}
                            {tx.isBoletoPaid ? 'Boleto Pago' : 'Boleto Pendente'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-5 text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(tx.createdAt).toLocaleString('pt-BR')}
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
          <div className="text-center text-slate-400 py-8">Carregando histórico...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-slate-400 py-8">Nenhum registro encontrado.</div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {tx.type === 'IN' ? <ArrowUpCircle className="w-6 h-6 text-blue-500" /> : <ArrowDownCircle className="w-6 h-6 text-brand-500" />}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white leading-tight">{tx.product.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{tx.type === 'IN' ? 'Entrada' : 'Venda'}</span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="font-black text-lg text-slate-800 dark:text-white">{tx.type === 'IN' ? '+' : '-'}{tx.quantity}</span>
                </div>
              </div>
              
              <div className="text-xs text-slate-400 font-medium mb-3 flex items-center gap-1">
                {new Date(tx.createdAt).toLocaleString('pt-BR')}
              </div>

              {tx.type === 'IN' && (tx.invoiceNumber || tx.hasBoleto) && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 mt-2 text-sm">
                  {tx.invoiceNumber && (
                    <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-300">
                      <FileText className="w-4 h-4 text-slate-400"/> NF: {tx.invoiceNumber}
                    </div>
                  )}
                  {tx.hasBoleto && (
                    <div className={`flex items-center gap-2 font-bold ${tx.isBoletoPaid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {tx.isBoletoPaid ? <CheckCircle2 className="w-4 h-4"/> : <Receipt className="w-4 h-4"/>}
                      {tx.isBoletoPaid ? 'Boleto Pago' : 'Boleto Pendente de Pagamento'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
