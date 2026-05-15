"use client";

import { useEffect, useState } from "react";
import { Users, Search, DollarSign, CheckCircle2, UserCircle2, Wallet, X, Edit, Trash2, ShieldAlert, History } from "lucide-react";
import { useSession } from "next-auth/react";

type Customer = {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
};

export default function ClientesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagamento Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit/Delete Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editName, setEditName] = useState("");

  // History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
        setFilteredCustomers(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredCustomers(customers.filter(c => c.name.toLowerCase().includes(lower)));
    }
  }, [searchTerm, customers]);

  const openPayModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPayAmount(customer.balance.toString());
    setIsPayModalOpen(true);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !payAmount || Number(payAmount) <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/customers/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: selectedCustomer.id, amount: Number(payAmount) })
      });

      if (res.ok) {
        setIsPayModalOpen(false);
        fetchCustomers();
      } else {
        alert("Erro ao processar pagamento");
      }
    } catch (error) {
      alert("Erro de conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditName(customer.name);
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !editName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName })
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchCustomers();
      } else {
        alert("Erro ao editar cliente");
      }
    } catch (error) {
      alert("Erro de conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        fetchCustomers();
      } else {
        alert("Erro ao excluir cliente. Verifique se ele possui transações vinculadas.");
      }
    } catch (error) {
      alert("Erro de conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHistoryModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setCustomerHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500 font-bold">Acesso negado. Apenas a diretoria pode acessar esta página.</div>;
  }

  const totalDebt = customers.reduce((acc, c) => acc + c.balance, 0);

  return (
    <main className="p-5 md:p-8 font-sans pb-28 md:pb-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-orange-500" /> Contas de Clientes
        </h2>
        <p className="text-slate-500 mt-2 font-medium">Gerencie clientes e realize a baixa de dívidas.</p>
      </header>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-3xl border border-orange-100 dark:border-orange-800/30 flex items-center gap-4">
          <div className="p-4 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-2xl">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest block mb-1">Total a Receber</span>
            <span className="text-3xl font-black text-orange-700 dark:text-orange-300">R$ {totalDebt.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center mb-6">
        <div className="pl-4 pr-2 text-slate-400"><Search className="w-5 h-5"/></div>
        <input 
          type="text" 
          placeholder="Buscar cliente pelo nome..." 
          className="w-full bg-transparent p-3 outline-none text-slate-800 dark:text-white font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 font-medium">Carregando clientes...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
             <UserCircle2 className="w-12 h-12 text-slate-300 mb-3" />
             <span className="text-slate-500 font-medium">Nenhum cliente encontrado.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <th className="p-5 font-bold">Cliente</th>
                  <th className="p-5 font-bold text-center">Dívida</th>
                  <th className="p-5 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-5 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black shrink-0">
                         {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <button 
                        onClick={() => openHistoryModal(customer)}
                        className="text-left hover:text-brand-600 dark:hover:text-brand-400 hover:underline underline-offset-4 transition-colors"
                        title="Ver histórico de compras"
                      >
                        {customer.name}
                      </button>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`text-lg font-black ${customer.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                        R$ {customer.balance.toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                    <td className="p-5 flex justify-end gap-2">
                      <button 
                        onClick={() => openPayModal(customer)}
                        disabled={customer.balance <= 0}
                        className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                          customer.balance > 0 
                            ? 'bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400 active:scale-95' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                        }`}
                      >
                        <DollarSign className="w-4 h-4" /> Baixar
                      </button>
                      <button 
                        onClick={() => openEditModal(customer)} 
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5"/>
                      </button>
                      <button 
                        onClick={() => openDeleteModal(customer)} 
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE PAGAMENTO */}
      {isPayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsPayModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Pagamento</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase">Conta Cliente</span>
                </div>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePay}>
              <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 mb-6">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1">Cliente</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white">{selectedCustomer.name}</p>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>
                <div className="flex justify-between items-center">
                   <span className="text-sm font-bold text-slate-500">Dívida Total:</span>
                   <span className="text-lg font-black text-red-500 dark:text-red-400">R$ {selectedCustomer.balance.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Valor Pago (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  max={selectedCustomer.balance}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-2xl font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-orange-500" 
                  value={payAmount} 
                  onChange={(e) => setPayAmount(e.target.value)} 
                  required 
                  autoFocus
                />
                <p className="text-xs text-slate-400 font-medium mt-2">
                  * Você pode pagar uma parte ou o valor total. O saldo devedor será atualizado.
                </p>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > selectedCustomer.balance} 
                className="w-full p-5 rounded-2xl text-lg font-bold text-white transition-all bg-orange-600 hover:bg-orange-700 active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processando...' : <><CheckCircle2 className="w-5 h-5"/> Confirmar Pagamento</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {isEditModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl">
                  <Edit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Editar Cliente</h3>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEdit}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Nome do Cliente</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !editName.trim()} 
                className="w-full p-5 rounded-2xl text-lg font-bold text-white transition-all bg-brand-600 hover:bg-brand-700 active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {isDeleteModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 border border-red-500 dark:border-red-900/50 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Excluir Cliente</h3>
                </div>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Tem certeza que deseja excluir o cliente <strong className="text-slate-800 dark:text-white">{selectedCustomer.name}</strong>?
              </p>
              {selectedCustomer.balance > 0 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-xl">
                  <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                    Aviso: Este cliente ainda possui uma dívida de R$ {selectedCustomer.balance.toFixed(2).replace('.', ',')}. Ao excluir, este registro será perdido.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 p-4 rounded-2xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                disabled={isSubmitting} 
                className="flex-1 p-4 rounded-2xl font-bold text-white transition-all bg-red-600 hover:bg-red-700 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE HISTÓRICO */}
      {isHistoryModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-2xl">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Histórico de Compras</h3>
                  <span className="text-sm font-bold text-slate-500">{selectedCustomer.name}</span>
                </div>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 min-h-[300px]">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-full text-slate-400 font-bold">Carregando histórico...</div>
              ) : customerHistory.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-slate-400">
                  <History className="w-12 h-12 mb-2 opacity-50" />
                  <span className="font-bold">Nenhuma compra registrada para este cliente.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerHistory.map((tx: any) => (
                    <div key={tx.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{tx.product?.name || "Produto Desconhecido"}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {new Date(tx.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-800 dark:text-white">Qtd: {tx.quantity}</p>
                        <p className="text-sm font-bold text-brand-600 dark:text-brand-400">R$ {tx.price ? tx.price.toFixed(2).replace('.', ',') : "0,00"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
