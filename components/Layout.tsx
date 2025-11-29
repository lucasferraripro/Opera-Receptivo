import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Bus, AlertTriangle, FileText, Menu, X, Moon, Sun, Map, Settings, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Painel', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Frota & Viagens', path: '/trips', icon: <Bus size={20} /> },
    { name: 'Embarques e Rotas', path: '/routes', icon: <Map size={20} /> },
    { name: 'Overbooking & Parceiros', path: '/overbooking', icon: <AlertTriangle size={20} /> },
    { name: 'Relatórios Diários', path: '/reports', icon: <FileText size={20} /> },
    { name: 'Configurações', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 dark:bg-slate-950 text-white transform transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-brand-500 p-2 rounded-lg shadow-lg shadow-brand-500/20">
              <Bus className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">TurismoFlow</span>
          </div>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50 dark:shadow-brand-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-900'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800 dark:border-slate-900">
          <div className="flex items-center justify-between gap-2 mb-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 dark:bg-slate-800 flex items-center justify-center text-sm font-bold border-2 border-slate-600 dark:border-slate-700 text-white">
                {user?.email?.slice(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="overflow-hidden">
                <p className="text-sm font-medium truncate w-32">{user?.email || 'Administrador'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Gerente</p>
                </div>
             </div>
          </div>
          <button 
             onClick={handleSignOut}
             className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
          >
             <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 transition-colors duration-200">
          <button className="p-2 -ml-2 lg:hidden text-slate-600 dark:text-slate-300" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
             <button 
               onClick={() => setIsDarkMode(!isDarkMode)}
               className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
               title="Alternar tema"
             >
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <div className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
               {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          {children}
        </div>
      </main>
    </div>
  );
};