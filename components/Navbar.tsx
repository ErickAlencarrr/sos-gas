"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, LayoutDashboard, FileText, LogOut, UserCircle, WalletCards, PackageOpen, Layers, Users, Settings } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === '/login') return null;

  const isAdmin = session?.user?.role === "ADMIN";

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Inventário', href: '/inventario', icon: Layers },
    ...(isAdmin ? [
      { name: 'Produtos', href: '/produtos', icon: PackageOpen },
      { name: 'Contas', href: '/contas', icon: WalletCards },
      { name: 'Clientes', href: '/clientes', icon: Users },
      { name: 'Relatórios', href: '/relatorios', icon: FileText },
      { name: 'Usuários', href: '/usuarios', icon: UserCircle },
      { name: 'Config', href: '/configuracoes', icon: Settings }
    ] : []),
  ];

  return (
    <>
      {/* Navegação Topo (Desktop) */}
      <nav className="hidden md:flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-8 py-4 items-center justify-between shadow-sm w-full">
        <div className="flex items-center gap-8 max-w-7xl mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mr-6">
            <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm relative group cursor-pointer">
              <img 
                src="/logo.png" 
                alt="Logo da Empresa" 
                className="w-full h-full object-cover text-[10px] text-transparent"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Flame className="w-6 h-6 text-brand-500 hidden" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                SOS Gás
              </h1>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Painel</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-2 flex-1">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all ${
                  pathname === item.href 
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Direita (User e Sair) */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right mr-2">
              <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{session?.user?.name || 'Carregando...'}</span>
              <span className="text-[10px] font-bold text-brand-500 uppercase">{session?.user?.role === 'ADMIN' ? 'Diretoria' : 'Funcionário'}</span>
            </div>
            
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
              title="Sair do Sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Menu Inferior (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center overflow-x-auto p-2 gap-1 snap-x scroll-smooth">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 p-3 min-w-[80px] shrink-0 rounded-2xl transition-all snap-start ${
                pathname === item.href 
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <item.icon className={`w-6 h-6 ${pathname === item.href ? 'fill-brand-100 dark:fill-brand-900/50' : ''}`} />
              <span className="text-[11px] font-bold text-center leading-tight">{item.name}</span>
            </Link>
          ))}
          
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex flex-col items-center justify-center gap-1 p-3 min-w-[80px] shrink-0 rounded-2xl transition-all text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 snap-start"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-[11px] font-bold text-center leading-tight">Sair</span>
          </button>
        </div>
      </nav>
    </>
  );
}
