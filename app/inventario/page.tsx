"use client";

import { useEffect, useState } from "react";
import { Layers, Flame, Droplets, PlusCircle, X, MinusCircle, FileText, Receipt, CheckCircle2, Box } from "lucide-react";

type Product = {
  id: string;
  name: string;
  type: "GAS" | "WATER";
  currentStock: number;
  emptyStock: number;
};

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State para Nova Carga (IN)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [hasBoleto, setHasBoleto] = useState(false);
  const [isBoletoPaid, setIsBoletoPaid] = useState(false);
  const [boletoAmount, setBoletoAmount] = useState("");
  const [boletoDueDate, setBoletoDueDate] = useState("");
  
  const [hasReturnedEmpty, setHasReturnedEmpty] = useState(true);
  const [emptyQuantity, setEmptyQuantity] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error("Erro ao buscar", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openModal = () => {
    setQuantity(1);
    setInvoiceNumber("");
    setHasBoleto(false);
    setIsBoletoPaid(false);
    setBoletoAmount("");
    setBoletoDueDate("");
    setHasReturnedEmpty(true);
    setEmptyQuantity(1);
    if (products.length > 0) setSelectedProduct(products[0].id);
    setIsModalOpen(true);
  };

  // Sync default empty quantity with received quantity if toggle is on
  useEffect(() => {
    if (hasReturnedEmpty) {
      setEmptyQuantity(quantity);
    } else {
      setEmptyQuantity(0);
    }
  }, [quantity, hasReturnedEmpty]);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        productId: selectedProduct,
        type: 'IN',
        quantity: Number(quantity),
        invoiceNumber,
        hasBoleto,
        isBoletoPaid: hasBoleto ? isBoletoPaid : false,
        boletoAmount,
        boletoDueDate,
        emptyQuantity: hasReturnedEmpty ? emptyQuantity : 0
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        alert("Erro ao registrar a carga.");
      }
    } catch (error) {
      alert("Erro de conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-5 md:p-8 font-sans pb-28 md:pb-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-brand-500" /> Inventário Total
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Controle geral de vasilhames físicos (Cheios e Vazios).</p>
        </div>
        <button onClick={openModal} className="bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-bold transition-all active:scale-95">
          <PlusCircle className="w-5 h-5" /> Receber Carga
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center text-slate-400 py-12">Calculando inventário...</div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center text-slate-400 py-12">Nenhum produto cadastrado.</div>
        ) : (
          products.map((product) => {
            const totalFisico = product.currentStock + product.emptyStock;
            
            return (
              <div key={product.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      {product.type === 'GAS' ? <Flame className="w-6 h-6 text-brand-500" /> : product.type === 'WATER' ? <Droplets className="w-6 h-6 text-blue-400" /> : <Box className="w-6 h-6 text-amber-500" />}
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{product.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Físico</p>
                    <p className="text-3xl font-black text-brand-600 dark:text-brand-400">{totalFisico} <span className="text-sm">un</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl p-4 flex flex-col justify-center items-center border border-brand-100 dark:border-brand-800/30">
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase mb-1">Pronto p/ Venda</span>
                    <span className="text-4xl font-black text-slate-800 dark:text-white">{product.currentStock}</span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Cheios</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center border border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-400 uppercase mb-1">Aguardando Carga</span>
                    <span className="text-4xl font-black text-slate-400">{product.emptyStock}</span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Vazios</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-white dark:bg-slate-950 w-full md:max-w-lg md:rounded-3xl rounded-t-[2.5rem] p-6 md:p-8 pb-12 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 transition-all max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6 md:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-8 h-8 text-slate-800 dark:text-white" />
                Nova Carga
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
                    <option key={p.id} value={p.id}>{p.name} (Vazios: {p.emptyStock})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Quantidade Recebida</label>
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

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 md:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Flame className="w-4 h-4 text-brand-500" /> Controle de Vasilhames
                </h4>

                <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Entregou vazios pro caminhão?</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={hasReturnedEmpty} onChange={(e) => setHasReturnedEmpty(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
                  </label>
                </div>

                {hasReturnedEmpty && (
                  <div className="animate-in fade-in zoom-in-95 duration-200">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Quantidade de Vazios Devolvidos</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-brand-500"
                      value={emptyQuantity}
                      onChange={(e) => setEmptyQuantity(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 md:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <FileText className="w-4 h-4 text-brand-500" /> Detalhes da Nota
                </h4>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nº da Nota Fiscal (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 000.123.456"
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Veio com Boleto?</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={hasBoleto} onChange={(e) => setHasBoleto(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
                  </label>
                </div>

                {hasBoleto && (
                  <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl border border-brand-100 dark:border-brand-800/30 animate-in fade-in zoom-in-95 duration-200 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Valor do Boleto</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="Ex: 1500.00"
                          className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                          value={boletoAmount} 
                          onChange={(e) => setBoletoAmount(e.target.value)} 
                          required={hasBoleto} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Vencimento</label>
                        <input 
                          type="date" 
                          className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                          value={boletoDueDate} 
                          onChange={(e) => setBoletoDueDate(e.target.value)} 
                          required={hasBoleto} 
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-5 h-5 ${isBoletoPaid ? 'text-green-500' : 'text-slate-400'}`} />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Boleto já Pago?</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isBoletoPaid} onChange={(e) => setIsBoletoPaid(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || products.length === 0}
                className={`w-full p-5 md:p-6 mt-6 rounded-2xl md:rounded-3xl text-xl font-bold text-white transition-all shadow-lg active:scale-[0.98] bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 ${isSubmitting || products.length === 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Registrando...' : 'Confirmar Carga'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
