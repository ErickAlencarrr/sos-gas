"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { maskCurrency, unmaskCurrency } from "@/lib/mask";
import { 
  PlusCircle, 
  MinusCircle, 
  Wallet, 
  X, 
  Flame, 
  Droplets,
  TrendingUp,
  PackageOpen,
  Receipt,
  CheckCircle2,
  FileText,
  Banknote,
  Smartphone,
  CreditCard,
  Check,
  Box,
  Trash2,
  Edit
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  type: "GAS" | "WATER" | "OTHERS";
  currentStock: number;
};

type Customer = {
  id: string;
  name: string;
  balance: number;
};

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [editTransactionId, setEditTransactionId] = useState("");

  // Campos de Venda (Saída)
  const [price, setPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [returnedEmpty, setReturnedEmpty] = useState(true);
  
  // Pagamento Múltiplo (Split)
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitValues, setSplitValues] = useState({ cash: "", pix: "", card: "", client: "" });
  
  // Campos de Cliente
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  
  // Resumo de Hoje e Fechamento
  const [todaySummary, setTodaySummary] = useState<any>(null);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Vendas de Hoje (Histórico Diário)
  const [isTodaySalesModalOpen, setIsTodaySalesModalOpen] = useState(false);
  const [todaySales, setTodaySales] = useState<any[]>([]);
  const [isLoadingTodaySales, setIsLoadingTodaySales] = useState(false);

  const fetchTodaySales = async () => {
    setIsLoadingTodaySales(true);
    try {
      const res = await fetch("/api/transactions/today");
      if (res.ok) setTodaySales(await res.json());
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoadingTodaySales(false);
    }
  };

  const handleEditClick = (tx: any) => {
    setEditTransactionId(tx.id);
    setSelectedProduct(tx.productId);
    setQuantity(tx.quantity);
    setPrice(tx.price ? tx.price.toFixed(2).replace('.', ',') : "");
    setPaymentMethod(tx.paymentMethod === 'SPLIT' ? 'SPLIT' : (tx.paymentMethod || 'CASH'));
    setReturnedEmpty(tx.returnedEmpty !== false);
    
    if (tx.paymentMethod === 'SPLIT') {
      setIsSplitPayment(true);
      setSplitValues({
        cash: tx.cashPrice ? tx.cashPrice.toFixed(2).replace('.', ',') : "",
        pix: tx.pixPrice ? tx.pixPrice.toFixed(2).replace('.', ',') : "",
        card: tx.cardPrice ? tx.cardPrice.toFixed(2).replace('.', ',') : "",
        client: tx.clientPrice ? tx.clientPrice.toFixed(2).replace('.', ',') : "",
      });
    } else {
      setIsSplitPayment(false);
      setSplitValues({ cash: "", pix: "", card: "", client: "" });
    }
    
    if (tx.customerId) {
      setSelectedCustomer(tx.customerId);
    } else {
      setSelectedCustomer("");
    }
    
    setIsTodaySalesModalOpen(false);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Tem certeza que deseja estornar esta venda? O estoque será restaurado e o valor removido do caixa.")) return;
    
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Venda estornada com sucesso!");
        fetchTodaySales(); // Atualiza a lista de vendas de hoje
        fetchProducts();   // Atualiza os painéis (estoque e resumo)
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao estornar venda.");
      }
    } catch (e) {
      toast.error("Erro de conexão.");
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/closing/summary");
      if(res.ok) setTodaySummary(await res.json());
    } catch(e) {}
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      if(res.ok) setCustomers(await res.json());
    } catch(e) {}
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      if(res.ok) {
        const data = await res.json();
        setProducts(data);
      }
      fetchSummary();
      fetchCustomers();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openModal = () => {
    setQuantity(1);
    setPrice("");
    setPaymentMethod("CASH");
    setIsSplitPayment(false);
    setSplitValues({ cash: "", pix: "", card: "", client: "" });
    setReturnedEmpty(true);
    setSelectedCustomer("");
    setNewCustomerName("");
    setIsCreatingCustomer(false);
    if (products.length > 0) setSelectedProduct(products[0].id);
    setIsModalOpen(true);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCustomerName })
      });
      if (res.ok) {
        const newCustomer = await res.json();
        await fetchCustomers();
        setSelectedCustomer(newCustomer.id);
        setIsCreatingCustomer(false);
        setNewCustomerName("");
      }
    } catch (error) {
      alert("Erro ao criar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;
    
    const unmaskedPrice = unmaskCurrency(price);
    const unmaskedCash = unmaskCurrency(splitValues.cash);
    const unmaskedPix = unmaskCurrency(splitValues.pix);
    const unmaskedCard = unmaskCurrency(splitValues.card);
    const unmaskedClient = unmaskCurrency(splitValues.client);

    if (isSplitPayment) {
      const sum = (parseFloat(unmaskedCash) + parseFloat(unmaskedPix) + parseFloat(unmaskedCard) + parseFloat(unmaskedClient)).toFixed(2);
      if (sum !== parseFloat(unmaskedPrice).toFixed(2)) {
        toast.warning(`A soma dos valores divididos (R$ ${sum.replace('.', ',')}) não bate com o Valor Total (R$ ${parseFloat(unmaskedPrice).toFixed(2).replace('.', ',')}).`);
        return;
      }
      if (parseFloat(unmaskedClient) > 0 && !selectedCustomer) {
        toast.warning("Selecione um cliente para o valor na Conta Cliente.");
        return;
      }
    } else {
      if (paymentMethod === 'CLIENT' && !selectedCustomer) {
        toast.warning("Selecione um cliente para a Conta Cliente.");
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        productId: selectedProduct,
        type: 'OUT',
        quantity: Number(quantity),
        price: unmaskedPrice,
        paymentMethod: isSplitPayment ? 'SPLIT' : paymentMethod,
        splitValues: isSplitPayment ? { cash: unmaskedCash, pix: unmaskedPix, card: unmaskedCard, client: unmaskedClient } : undefined,
        returnedEmpty: returnedEmpty,
        customerId: (isSplitPayment && parseFloat(unmaskedClient) > 0) || (!isSplitPayment && paymentMethod === 'CLIENT') ? selectedCustomer : null
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        toast.success("Venda registrada com sucesso!");
        setIsModalOpen(false);
        fetchProducts();
      } else {
        toast.error("Erro ao salvar transação");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmClosing = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/closing", { method: "POST" });
      if(res.ok) {
        const data = await res.json();
        setIsClosingModalOpen(false);
        router.push(`/relatorios/fechamento/${data.id}`);
      } else {
        alert("Erro ao fechar caixa");
      }
    } catch (error) {
      alert("Erro de conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-5 md:p-8 font-sans pb-28 md:pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna Esquerda: Estoque & Resumo */}
        <div className="lg:col-span-8">
          <header className="mb-6 flex justify-between items-center md:hidden">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                 <img 
                   src="/logo.png" 
                   alt="Logo" 
                   className="w-full h-full object-cover"
                   onError={(e) => {
                     e.currentTarget.style.display = 'none';
                     e.currentTarget.nextElementSibling?.classList.remove('hidden');
                   }}
                 />
                 <Flame className="w-6 h-6 text-brand-500 hidden" />
               </div>
               <h2 className="text-2xl font-black text-slate-800 dark:text-white">SOS Gás</h2>
             </div>
          </header>

          {/* Resumo do Dia (Visível apenas se isAdmin ou se quiser que funcionário também veja) */}
          {todaySummary && (
            <section className="mb-8">
              <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                 Resumo do Caixa (Hoje)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-3xl border border-brand-100 dark:border-brand-800/30">
                  <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase">Faturamento</span>
                  <p className="text-xl font-black text-slate-800 dark:text-white mt-1">R$ {todaySummary.totalRevenue.toFixed(2).replace('.',',')}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-slate-400 mb-1">
                    <Smartphone className="w-4 h-4"/> <span className="text-[10px] font-black uppercase">PIX</span>
                  </div>
                  <p className="text-lg font-black text-slate-800 dark:text-white">R$ {todaySummary.pixTotal.toFixed(2).replace('.',',')}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-slate-400 mb-1">
                    <Banknote className="w-4 h-4"/> <span className="text-[10px] font-black uppercase">Dinheiro</span>
                  </div>
                  <p className="text-lg font-black text-slate-800 dark:text-white">R$ {todaySummary.cashTotal.toFixed(2).replace('.',',')}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <CreditCard className="w-4 h-4"/> <span className="text-[10px] font-black uppercase tracking-widest">Cartão</span>
                  </div>
                  <p className="text-lg font-black text-slate-800 dark:text-white">R$ {todaySummary.cardTotal.toFixed(2).replace('.',',')}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <PackageOpen className="w-4 h-4"/> <span className="text-[10px] font-black uppercase tracking-widest">Conta Cliente</span>
                  </div>
                  <p className="text-lg font-black text-slate-800 dark:text-white">R$ {todaySummary.clientTotal.toFixed(2).replace('.',',')}</p>
                </div>
                </div>
            </section>
          )}

          <div className="hidden md:block mb-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <PackageOpen className="w-6 h-6 text-brand-500" /> Visão de Estoque
            </h2>
          </div>

          <section className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {isLoading ? (
              <div className="col-span-full text-center text-slate-500 dark:text-slate-400 py-12 font-medium animate-pulse bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                Sincronizando estoque...
              </div>
            ) : products.length === 0 ? (
              <div className="col-span-full text-center text-slate-400 py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                <PackageOpen className="w-12 h-12 mb-3 opacity-50" />
                <span>Nenhum produto cadastrado.</span>
              </div>
            ) : products.map((product) => (
              <div 
                key={product.id} 
                className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden"
              >
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-5 pointer-events-none">
                  {product.type === 'GAS' ? <Flame className="w-32 h-32" /> : product.type === 'WATER' ? <Droplets className="w-32 h-32" /> : <Box className="w-32 h-32" />}
                </div>
                
                <div className="flex items-center gap-1.5 mb-3 md:mb-4 z-10">
                  {product.type === 'GAS' ? (
                    <Flame className="w-4 h-4 md:w-5 md:h-5 text-brand-500" />
                  ) : product.type === 'WATER' ? (
                    <Droplets className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                  ) : (
                    <Box className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                  )}
                  <span className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{product.name}</span>
                </div>
                
                <span className={`text-6xl md:text-7xl font-black z-10 tracking-tighter ${
                  product.currentStock <= 5 
                    ? 'text-red-500 dark:text-red-400' 
                    : 'text-slate-800 dark:text-white'
                }`}>
                  {product.currentStock}
                </span>
                <span className="text-[11px] font-bold text-slate-400 uppercase mt-1 z-10">Disponíveis (Cheios)</span>
                {product.currentStock <= 5 && (
                  <span className="text-[10px] md:text-xs text-red-500 font-bold mt-2 uppercase animate-pulse bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                    Estoque Baixo
                  </span>
                )}
              </div>
            ))}
          </section>
        </div>

        {/* Coluna Direita: Ações */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 h-full">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-2">
               Ações Rápidas
            </h2>
            
            <div className="space-y-4 md:space-y-5">
              <button 
                onClick={openModal} 
                className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-3 transition-all hover:-translate-y-1"
              >
                <TrendingUp className="w-7 h-7 stroke-[2.5]" />
                <span className="text-2xl md:text-3xl font-black tracking-wide">Vender</span>
              </button>

              <div className="pt-4 pb-2">
                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full rounded-full"></div>
              </div>

              <button 
                onClick={() => {
                  fetchTodaySales();
                  setIsTodaySalesModalOpen(true);
                }} 
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 p-4 md:p-5 rounded-2xl md:rounded-3xl flex items-center justify-center space-x-3 transition-all"
              >
                <FileText className="w-6 h-6 stroke-2 text-slate-500" />
                <span className="text-lg md:text-xl font-bold tracking-wide">Vendas de Hoje</span>
              </button>

              {isAdmin && (
                <button 
                  onClick={() => setIsClosingModalOpen(true)} 
                  className="w-full bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 border-2 border-brand-200 dark:border-brand-800/30 text-brand-700 dark:text-brand-400 p-4 md:p-5 rounded-2xl md:rounded-3xl flex items-center justify-center space-x-3 transition-all mt-2"
                >
                  <Wallet className="w-6 h-6 stroke-2 text-brand-500" />
                  <span className="text-lg md:text-xl font-bold tracking-wide">Fechar Caixa</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL BOTTOM SHEET DE VENDAS/ENTRADAS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-white dark:bg-slate-950 w-full md:max-w-lg md:rounded-3xl rounded-t-[2.5rem] p-6 md:p-8 pb-12 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 transition-all max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6 md:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-brand-500" />
                Registrar Venda
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleTransaction} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Produto</label>
                <select 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                >
                  {products.length === 0 && <option value="">Sem produtos cadastrados</option>}
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Estoque: {p.currentStock})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Quantidade</label>
                <div className="flex items-center gap-4">
                  <button 
                    type="button" 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-600 dark:text-slate-300 active:scale-95 transition-transform shrink-0"
                  >
                    <MinusCircle className="w-8 h-8" />
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    className="flex-1 w-full h-14 md:h-16 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-3xl font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 m-0 p-0"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-600 dark:text-slate-300 active:scale-95 transition-transform shrink-0"
                  >
                    <PlusCircle className="w-8 h-8" />
                  </button>
                </div>
              </div>

              {/* OPÇÕES EXTRAS PARA VENDA (OUT) */}
              <div className="bg-brand-50 dark:bg-brand-900/20 p-4 md:p-5 rounded-3xl border border-brand-100 dark:border-brand-800/30 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Valor Total Cobrado (R$)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 110,00"
                      className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-bold outline-none focus:ring-2 focus:ring-brand-500" 
                      value={price} 
                      onChange={(e) => setPrice(maskCurrency(e.target.value))} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Forma de Pagamento</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => { setPaymentMethod('CASH'); setIsSplitPayment(false); }} className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all ${paymentMethod === 'CASH' && !isSplitPayment ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'}`}>
                        <Banknote className="w-6 h-6" /> <span className="text-[10px] font-black uppercase tracking-widest">Dinheiro</span>
                      </button>
                      <button type="button" onClick={() => { setPaymentMethod('PIX'); setIsSplitPayment(false); }} className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all ${paymentMethod === 'PIX' && !isSplitPayment ? 'bg-teal-500 text-white border-teal-500' : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'}`}>
                        <Smartphone className="w-6 h-6" /> <span className="text-[10px] font-black uppercase tracking-widest">PIX</span>
                      </button>
                      <button type="button" onClick={() => { setPaymentMethod('CARD'); setIsSplitPayment(false); }} className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all ${paymentMethod === 'CARD' && !isSplitPayment ? 'bg-purple-500 text-white border-purple-500' : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'}`}>
                        <CreditCard className="w-6 h-6" /> <span className="text-[10px] font-black uppercase tracking-widest">Cartão</span>
                      </button>
                      <button type="button" onClick={() => { setPaymentMethod('CLIENT'); setIsSplitPayment(false); }} className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all ${paymentMethod === 'CLIENT' && !isSplitPayment ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'}`}>
                        <PackageOpen className="w-6 h-6" /> <span className="text-[10px] font-black uppercase tracking-widest">Conta Cliente</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Pagamento Múltiplo (Dividir)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isSplitPayment} onChange={(e) => { setIsSplitPayment(e.target.checked); if (e.target.checked) setPaymentMethod(''); }} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
                    </label>
                  </div>

                  {isSplitPayment && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Dividir os valores</p>
                      
                      <div className="flex items-center gap-3">
                        <Banknote className="w-5 h-5 text-brand-500 shrink-0" />
                        <input type="text" placeholder="Dinheiro" className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none" value={splitValues.cash} onChange={e => setSplitValues({...splitValues, cash: maskCurrency(e.target.value)})} />
                      </div>
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-teal-500 shrink-0" />
                        <input type="text" placeholder="PIX" className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none" value={splitValues.pix} onChange={e => setSplitValues({...splitValues, pix: maskCurrency(e.target.value)})} />
                      </div>
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-purple-500 shrink-0" />
                        <input type="text" placeholder="Cartão" className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none" value={splitValues.card} onChange={e => setSplitValues({...splitValues, card: maskCurrency(e.target.value)})} />
                      </div>
                      <div className="flex items-center gap-3">
                        <PackageOpen className="w-5 h-5 text-orange-500 shrink-0" />
                        <input type="text" placeholder="Conta Cliente" className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none" value={splitValues.client} onChange={e => setSplitValues({...splitValues, client: maskCurrency(e.target.value)})} />
                      </div>
                    </div>
                  )}

                  {(paymentMethod === 'CLIENT' || (isSplitPayment && parseFloat(splitValues.client || "0") > 0)) && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                      <label className="block text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">Selecione o Cliente</label>
                      {!isCreatingCustomer ? (
                        <div className="flex gap-2">
                          <select
                            className="flex-1 p-3 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500"
                            value={selectedCustomer}
                            onChange={(e) => setSelectedCustomer(e.target.value)}
                          >
                            <option value="">-- Escolha um cliente --</option>
                            {customers.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setIsCreatingCustomer(true)}
                            className="p-3 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl font-bold text-sm hover:bg-orange-200 transition-colors"
                          >
                            Novo
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nome do cliente"
                            className="flex-1 p-3 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleCreateCustomer}
                            disabled={!newCustomerName.trim() || isSubmitting}
                            className="p-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsCreatingCustomer(false); setNewCustomerName(""); }}
                            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
                    <div className="flex items-center gap-2">
                      <PackageOpen className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Houve devolução de vasilhame?</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={returnedEmpty} onChange={(e) => setReturnedEmpty(e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
                    </label>
                  </div>
                </div>

              <button 
                type="submit" 
                disabled={isSubmitting || products.length === 0}
                className={`w-full p-5 md:p-6 mt-6 rounded-2xl md:rounded-3xl text-xl font-bold text-white transition-all shadow-lg active:scale-[0.98] bg-brand-600 hover:bg-brand-700 shadow-brand-500/25 ${isSubmitting || products.length === 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Registrando...' : 'Confirmar Lançamento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE FECHAMENTO DE CAIXA (ADMIN) */}
      {isClosingModalOpen && todaySummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsClosingModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-2xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Fechamento</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase">Conferência do Dia</span>
                </div>
              </div>
              <button onClick={() => setIsClosingModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Produtos Vendidos:</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">{todaySummary.totalSales} un</span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold flex items-center gap-2 text-slate-600 dark:text-slate-300"><Banknote className="w-4 h-4"/> Dinheiro na Gaveta</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">R$ {todaySummary.cashTotal.toFixed(2).replace('.',',')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold flex items-center gap-2 text-slate-600 dark:text-slate-300"><Smartphone className="w-4 h-4"/> PIX (Conta Banco)</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">R$ {todaySummary.pixTotal.toFixed(2).replace('.',',')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold flex items-center gap-2 text-slate-600 dark:text-slate-300"><CreditCard className="w-4 h-4"/> Maquininha (Cartão)</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">R$ {todaySummary.cardTotal.toFixed(2).replace('.',',')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold flex items-center gap-2 text-slate-600 dark:text-slate-300"><PackageOpen className="w-4 h-4"/> Conta Cliente</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">R$ {todaySummary.clientTotal.toFixed(2).replace('.',',')}</span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>
              <div className="flex justify-between items-end bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-800/30">
                <span className="text-sm font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">Faturamento Total</span>
                <span className="text-2xl font-black text-brand-700 dark:text-brand-300">R$ {todaySummary.totalRevenue.toFixed(2).replace('.',',')}</span>
              </div>
            </div>

            <button 
              onClick={confirmClosing}
              disabled={isSubmitting} 
              className="w-full p-5 rounded-2xl text-lg font-bold text-white transition-all bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Registrando...' : <><Check className="w-5 h-5"/> Confirmar Fechamento</>}
            </button>
          </div>
        </div>
      )}
      {/* MODAL DE VENDAS DE HOJE */}
      {isTodaySalesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsTodaySalesModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Vendas de Hoje</h3>
                  <span className="text-sm font-bold text-slate-500">Transações do caixa atual</span>
                </div>
              </div>
              <button onClick={() => setIsTodaySalesModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 min-h-[300px]">
              {isLoadingTodaySales ? (
                <div className="flex justify-center items-center h-full text-slate-400 font-bold">Carregando vendas...</div>
              ) : todaySales.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-slate-400">
                  <FileText className="w-12 h-12 mb-2 opacity-50" />
                  <span className="font-bold">Nenhuma venda registrada hoje.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySales.map((tx: any) => (
                    <div key={tx.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 dark:text-white">{tx.product?.name || "Produto"}</p>
                          {tx.returnedEmpty === false && (
                            <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full" title="Não devolveu vasilhame">Sem Vasilhame</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-1 flex flex-col gap-1">
                          <span>
                            {new Date(tx.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} 
                            {tx.paymentMethod === 'CASH' && ' • Dinheiro'}
                            {tx.paymentMethod === 'PIX' && ' • PIX'}
                            {tx.paymentMethod === 'CARD' && ' • Cartão'}
                            {tx.paymentMethod === 'CLIENT' && tx.customer && ` • Cliente: ${tx.customer.name}`}
                            {tx.paymentMethod === 'SPLIT' && ` • Pagamento Múltiplo`}
                          </span>
                          {tx.paymentMethod === 'SPLIT' && (
                            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg inline-block w-fit mt-1">
                              {tx.cashPrice > 0 && `Dinheiro: R$ ${tx.cashPrice.toFixed(2).replace('.',',')} | `}
                              {tx.pixPrice > 0 && `PIX: R$ ${tx.pixPrice.toFixed(2).replace('.',',')} | `}
                              {tx.cardPrice > 0 && `Cartão: R$ ${tx.cardPrice.toFixed(2).replace('.',',')} | `}
                              {tx.clientPrice > 0 && `Cliente: R$ ${tx.clientPrice.toFixed(2).replace('.',',')} `}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-800 dark:text-white">Qtd: {tx.quantity}</p>
                        <p className="text-sm font-bold text-brand-600 dark:text-brand-400">R$ {tx.price ? tx.price.toFixed(2).replace('.', ',') : "0,00"}</p>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <button 
                            onClick={() => handleEditClick(tx)}
                            title="Editar Venda"
                            className="p-2.5 bg-blue-50 text-blue-500 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-xl transition-colors active:scale-95"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTransaction(tx.id)}
                            title="Estornar Venda"
                            className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl transition-colors active:scale-95"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
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
