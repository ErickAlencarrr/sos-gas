"use client";

import { useEffect, useState } from "react";
import { PackageOpen, Edit, Trash2, Plus, X, Flame, Droplets, Box } from "lucide-react";

type Product = {
  id: string;
  name: string;
  type: "GAS" | "WATER" | "OTHERS";
  unit: "UNIDADE" | "PACOTE" | "METRO" | "LITRO" | "KG";
  currentStock: number;
  emptyStock: number;
};

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"GAS" | "WATER" | "OTHERS">("GAS");
  const [unit, setUnit] = useState<"UNIDADE" | "PACOTE" | "METRO" | "LITRO" | "KG">("UNIDADE");
  const [currentStock, setCurrentStock] = useState(0);
  const [emptyStock, setEmptyStock] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openModal = (product?: Product) => {
    if (product) {
      setIsEditing(true);
      setEditId(product.id);
      setName(product.name);
      setType(product.type);
      setUnit(product.unit || "UNIDADE");
      setCurrentStock(product.currentStock);
      setEmptyStock(product.emptyStock);
    } else {
      setIsEditing(false);
      setEditId("");
      setName("");
      setType("GAS");
      setUnit("UNIDADE");
      setCurrentStock(0);
      setEmptyStock(0);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { name, type, unit, currentStock, emptyStock: type === 'OTHERS' ? 0 : emptyStock };
    const url = isEditing ? `/api/products/${editId}` : "/api/products";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchProducts();
      } else alert("Erro ao salvar produto.");
    } catch {
      alert("Erro de conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Atenção: Deletar este produto apagará todo o histórico de vendas dele! Continuar?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) fetchProducts();
      else alert("Erro ao deletar.");
    } catch {
      alert("Erro de conexão.");
    }
  };

  return (
    <main className="p-5 md:p-8 font-sans pb-28 md:pb-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <PackageOpen className="w-8 h-8 text-brand-500" /> Cadastro de Produtos
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Adicione ou edite os produtos do depósito.</p>
        </div>
        <button onClick={() => openModal()} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-2xl shadow-lg shadow-brand-500/25 flex items-center gap-2 font-bold transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Novo Produto
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando produtos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <th className="p-5 font-bold">Produto</th>
                  <th className="p-5 font-bold text-center">Estoque Atual (Cheios)</th>
                  <th className="p-5 font-bold text-center">Vasilhames (Vazios)</th>
                  <th className="p-5 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {products.map(product => (
                  <tr key={product.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-5 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      {product.type === 'GAS' ? <Flame className="w-4 h-4 text-brand-500" /> : <Droplets className="w-4 h-4 text-blue-400" />}
                      {product.name}
                    </td>
                    <td className="p-5 font-black text-center text-lg">{product.currentStock}</td>
                    <td className="p-5 font-black text-center text-lg text-slate-400">{product.emptyStock}</td>
                    <td className="p-5 flex justify-end gap-2">
                      <button onClick={() => openModal(product)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Produto</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Gás P13" required className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                  <select value={type} onChange={(e: any) => setType(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 font-bold">
                    <option value="GAS">Gás</option>
                    <option value="WATER">Água</option>
                    <option value="OTHERS">Diversos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Medida</label>
                  <select value={unit} onChange={(e: any) => setUnit(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 font-bold">
                    <option value="UNIDADE">Unidade (un)</option>
                    <option value="PACOTE">Pacote (pct)</option>
                    <option value="METRO">Metro (m)</option>
                    <option value="KG">Quilo (kg)</option>
                    <option value="LITRO">Litro (L)</option>
                  </select>
                </div>
              </div>

              <div className={`grid ${type === 'OTHERS' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {type === 'OTHERS' ? 'Quantidade Inicial' : 'Cheios (Qtd)'}
                  </label>
                  <input type="number" value={currentStock} onChange={(e) => setCurrentStock(Number(e.target.value))} required className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 text-center text-xl font-black" />
                </div>
                {type !== 'OTHERS' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Vazios (Qtd)</label>
                    <input type="number" value={emptyStock} onChange={(e) => setEmptyStock(Number(e.target.value))} required className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 text-center text-xl font-black text-slate-400" />
                  </div>
                )}
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full p-5 mt-4 rounded-2xl text-lg font-bold text-white transition-all bg-brand-600 hover:bg-brand-700 active:scale-95 shadow-lg shadow-brand-500/25">
                {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
