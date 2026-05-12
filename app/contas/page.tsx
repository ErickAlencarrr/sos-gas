"use client";

import { useEffect, useState } from "react";
import { WalletCards, CheckCircle2, XCircle, Plus, X, Receipt, Trash2 } from "lucide-react";

type Bill = {
  id: string;
  title: string;
  amount: number | null;
  dueDate: string;
  isPaid: boolean;
  isRecurring: boolean;
  transaction?: { product?: { name: string } };
};

export default function ContasPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bills");
      if (res.ok) setBills(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, []);

  const openModal = () => {
    setTitle("");
    setAmount("");
    setDueDate("");
    setIsRecurring(false);
    setIsPaid(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount, dueDate, isRecurring, isPaid })
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchBills();
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePaid = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: !currentStatus })
      });
      if (res.ok) fetchBills();
    } catch {
      alert("Erro ao atualizar.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta conta de forma definitiva?")) return;
    try {
      const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
      if (res.ok) fetchBills();
    } catch {
      alert("Erro de conexão.");
    }
  };

  return (
    <main className="p-5 md:p-8 font-sans pb-28 md:pb-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <WalletCards className="w-8 h-8 text-brand-500" /> Contas a Pagar
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Gestão de boletos de cargas e despesas recorrentes.</p>
        </div>
        <button onClick={openModal} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-2xl shadow-lg shadow-brand-500/25 flex items-center gap-2 font-bold transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Nova Conta
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full text-center text-slate-400 py-8">Carregando contas...</div>
        ) : bills.length === 0 ? (
          <div className="col-span-full text-center text-slate-400 py-8">Nenhuma conta cadastrada no momento.</div>
        ) : (
          bills.map(bill => {
            const isLate = !bill.isPaid && new Date(bill.dueDate) < new Date(new Date().setHours(0,0,0,0));
            return (
              <div key={bill.id} className={`bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border ${isLate ? 'border-red-500 dark:border-red-900/50' : 'border-slate-100 dark:border-slate-800'} relative overflow-hidden transition-all hover:shadow-md`}>
                {bill.isPaid && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase">Pago</div>}
                {isLate && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase animate-pulse">Atrasado</div>}
                
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-3 rounded-2xl ${bill.isPaid ? 'bg-green-50 dark:bg-green-900/20 text-green-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg leading-tight pr-12">{bill.title}</h4>
                    {bill.isRecurring && <span className="text-[10px] font-bold text-brand-500 uppercase bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full mt-1 inline-block">Recorrente</span>}
                  </div>
                </div>

                <div className="flex justify-between items-end mb-5">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">
                      {bill.amount ? `R$ ${bill.amount.toFixed(2).replace('.', ',')}` : <span className="text-slate-400 text-lg">A definir</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Vence em</p>
                    <p className={`font-bold ${isLate ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                      {new Date(bill.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button onClick={() => togglePaid(bill.id, bill.isPaid)} className={`flex-1 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${bill.isPaid ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700' : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50'}`}>
                    {bill.isPaid ? <XCircle className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>}
                    {bill.isPaid ? 'Desfazer' : 'Marcar Pago'}
                  </button>
                  <button onClick={() => handleDelete(bill.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Nova Conta</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Descrição / Título</label>
                <input type="text" placeholder="Ex: Conta de Luz, Aluguel..." value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Vencimento</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Despesa Recorrente?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
                </label>
              </div>

              <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/30">
                <span className="text-sm font-bold text-green-700 dark:text-green-400">Já está Pago?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-500"></div>
                </label>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full p-5 mt-2 rounded-2xl text-lg font-bold text-white transition-all bg-brand-600 hover:bg-brand-700 active:scale-95 shadow-lg shadow-brand-500/25">
                {isSubmitting ? 'Salvando...' : 'Adicionar Conta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
