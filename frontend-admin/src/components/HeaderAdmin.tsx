import { Menu, Bell, Search, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  setIsOpen: (isOpen: boolean) => void;
}

export default function HeaderAdmin({ setIsOpen }: HeaderProps) {
  const [admin, setAdmin] = useState({ name: 'Administrateur', email: 'admin@monhopital.com' });

  useEffect(() => {
    try {
      const adminStr = localStorage.getItem('admin');
      if (adminStr) {
        setAdmin(JSON.parse(adminStr));
      } else {
        // Fallback: decode JWT token to get email if admin object is missing
        const token = localStorage.getItem('adminToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.email) {
            const namePart = payload.email.split('@')[0];
            const fallbackName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
            setAdmin({ name: fallbackName, email: payload.email });
          }
        }
      }
    } catch (e) {
      console.error("Erreur de lecture des infos admin", e);
    }
  }, []);

  return (
    <header className="sticky top-4 z-30 mx-4 lg:mx-0 lg:mr-4">
      <div className="glass rounded-[2rem] h-20 flex items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsOpen(true)}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-600 bg-white/50 hover:bg-white rounded-xl transition-colors shadow-sm"
          >
            <Menu size={20} />
          </button>
          
          {/* Barre de recherche Glass */}
          <div className="hidden md:flex items-center bg-white/40 border border-white/60 rounded-full px-5 py-2.5 w-64 lg:w-80 focus-within:bg-white/80 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-inner">
            <Search size={18} className="text-slate-400 mr-3" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <button className="relative w-10 h-10 flex items-center justify-center bg-white/50 hover:bg-white rounded-full text-slate-600 transition-all shadow-sm">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="h-8 w-px bg-slate-200/50 hidden md:block"></div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-800 leading-tight">{admin.name}</p>
              <p className="text-xs text-slate-500 font-medium">{admin.email}</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 border-2 border-white shadow-md">
              <User size={20} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
