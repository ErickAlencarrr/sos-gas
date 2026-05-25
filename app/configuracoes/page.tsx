"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Settings, AlertOctagon, PackageX, ArchiveX, Trash2, Calendar, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  // Estados dos modais de confirmação
  const [modalType, setModalType] = useState<"STOCK" | "PRODUCTS" | "HISTORY" | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500 font-bold">Acesso negado. Apenas a diretoria pode acessar esta página.</div>;
  }

  const openConfirmModal = (type: "STOCK" | "PRODUCTS" | "HISTORY") => {
    setModalType(type);
    setConfirmText("");
    setHistoryDate("");
  };

  const closeModal = () => {
    setModalType(null);
    setConfirmText("");
    setHistoryDate("");
    setIsSubmitting(false);
  };

  const handleAction = async () => {
    if (confirmText !== "CONFIRMAR") {
      alert("Digite CONFIRMAR exatamente como solicitado.");
      return;
    }

    setIsSubmitting(true);
    try {
      let endpoint = "";
      let payload = {};

      if (modalType === "STOCK") endpoint = "/api/admin/reset/stock";
      else if (modalType === "PRODUCTS") endpoint = "/api/admin/reset/products";
      else if (modalType === "HISTORY") {
        endpoint = "/api/admin/reset/history";
        if (historyDate) payload = { date: historyDate };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Ação executada com sucesso!");
        closeModal();
      } else {
        toast.error("Erro ao executar ação.");
      }
    } catch (e) {
      toast.error("Erro de conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-5 md:p-8 font-sans pb-28 md:pb-8 max-w-4xl mx-auto">
      <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h2 className="text-3xl font-black text-red-600 dark:text-red-500 flex items-center gap-3">
          <AlertOctagon className="w-8 h-8" /> Zona de Perigo (Reset)
        </h2>
        <p className="text-slate-500 mt-2 font-medium">As ações abaixo são irreversíveis e afetam os dados do sistema. Proceda com cautela.</p>
      </header>

      <div className="space-y-6">
        {/* Reset Estoque/Produtos */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <PackageX className="w-6 h-6 text-slate-400" /> Controle de Estoque
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">Zerar Estoque</h4>
              <p className="text-sm text-slate-500 mb-4 h-10">Mantém os produtos cadastrados, mas atualiza a quantidade de Cheios e Vazios para ZERO.</p>
              <button 
                onClick={() => openConfirmModal("STOCK")}
                className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white py-3 rounded-xl font-bold transition-colors"
              >
                Zerar Quantidades
              </button>
            </div>
            
            <div className="p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
              <h4 className="font-bold text-red-700 dark:text-red-400 mb-2">Apagar Produtos</h4>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4 h-10">Deleta completamente todos os produtos e seu histórico vinculado do banco de dados.</p>
              <button 
                onClick={() => openConfirmModal("PRODUCTS")}
                className="w-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 py-3 rounded-xl font-bold transition-colors"
              >
                Apagar Tudo
              </button>
            </div>
          </div>
        </section>

        {/* Reset Histórico */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <ArchiveX className="w-6 h-6 text-slate-400" /> Histórico de Vendas
          </h3>
          
          <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">Limpar Histórico</h4>
              <p className="text-sm text-slate-500">
                Apaga as transações, fechamentos de caixa e contas a pagar associadas. Usuários, clientes e os cadastros de produtos serão mantidos.
              </p>
            </div>
            <div className="w-full md:w-auto shrink-0 flex gap-2">
              <button 
                onClick={() => openConfirmModal("HISTORY")}
                className="w-full md:w-auto px-6 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Iniciar Limpeza
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE SEGURANÇA */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 border border-red-500 dark:border-red-900/50">
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Atenção!</h3>
                  <span className="text-xs font-bold text-red-500 uppercase">Ação Irreversível</span>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {modalType === "STOCK" && "Você está prestes a zerar o estoque atual e de vazios de todos os produtos."}
                {modalType === "PRODUCTS" && "Você vai apagar TODOS os produtos, o que também deletará TODAS as vendas já feitas no sistema."}
                {modalType === "HISTORY" && "Você vai apagar o histórico de vendas e fechamentos de caixa do sistema."}
              </p>

              {modalType === "HISTORY" && (
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 mb-2">Deseja apagar de uma data específica?</label>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-2">Deixe em branco para apagar TODO o histórico.</p>
                </div>
              )}

              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/30">
                <label className="block text-xs font-bold text-red-700 dark:text-red-400 mb-2 uppercase tracking-widest">Digite CONFIRMAR para continuar</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-red-200 dark:border-red-900/50 rounded-xl text-lg font-black outline-none focus:ring-2 focus:ring-red-500" 
                  value={confirmText} 
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())} 
                  placeholder="CONFIRMAR"
                  autoFocus
                />
              </div>
            </div>

            <button 
              onClick={handleAction}
              disabled={isSubmitting || confirmText !== "CONFIRMAR"} 
              className="w-full p-4 rounded-2xl text-lg font-bold text-white transition-all bg-red-600 hover:bg-red-700 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processando...' : 'Executar Ação Destrutiva'}
            </button>
          </div>
        </div>
      )}

    </main>
  );
}