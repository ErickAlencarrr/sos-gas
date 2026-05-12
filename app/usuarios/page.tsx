"use client";

import { useEffect, useState } from "react";
import { UserCircle, Trash2, Edit, Plus, X } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EMPLOYEE">("EMPLOYEE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openModal = (user?: User) => {
    if (user) {
      setIsEditing(true);
      setEditId(user.id);
      setName(user.name);
      setEmail(user.email);
      setPassword(""); 
      setRole(user.role);
    } else {
      setIsEditing(false);
      setEditId("");
      setName("");
      setEmail("");
      setPassword("");
      setRole("EMPLOYEE");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { name, email, password, role };
    const url = isEditing ? `/api/users/${editId}` : "/api/users";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else alert("Erro ao salvar usuário.");
    } catch {
      alert("Erro de conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
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
            <UserCircle className="w-8 h-8 text-brand-500" /> Usuários
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Gerencie quem tem acesso ao sistema.</p>
        </div>
        <button onClick={() => openModal()} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-2xl shadow-lg shadow-brand-500/25 flex items-center gap-2 font-bold transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Novo
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando usuários...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                <th className="p-5 font-bold">Nome</th>
                <th className="p-5 font-bold">E-mail (Acesso)</th>
                <th className="p-5 font-bold">Cargo</th>
                <th className="p-5 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {users.map(user => (
                <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-5 font-bold text-slate-800 dark:text-white">{user.name}</td>
                  <td className="p-5 text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30' : 'bg-slate-100 text-slate-700 dark:bg-slate-800'}`}>
                      {user.role === 'ADMIN' ? 'Diretoria' : 'Funcionário'}
                    </span>
                  </td>
                  <td className="p-5 flex justify-end gap-2">
                    <button onClick={() => openModal(user)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(user.id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail (Login)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{isEditing ? 'Nova Senha (vazio p/ não alterar)' : 'Senha'}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!isEditing} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
                <select value={role} onChange={(e: any) => setRole(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 font-bold">
                  <option value="EMPLOYEE">Funcionário (Acesso Restrito)</option>
                  <option value="ADMIN">Diretoria (Acesso Total)</option>
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full p-5 mt-4 rounded-2xl text-lg font-bold text-white transition-all bg-brand-600 hover:bg-brand-700 active:scale-95 shadow-lg shadow-brand-500/25">
                {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
