import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LogOut, 
  Activity,
  Menu,
  X,
  ScanBarcode,
  PackageSearch,
  FileText
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  const storedPharmacien = JSON.parse(localStorage.getItem('pharmacien') || 'null');
  const pharmacien = storedPharmacien || { name: 'Pharmacien', pharmacyName: 'PHARMACIE' };
  const initials = pharmacien.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'PH';

  const handleLogout = () => {
    localStorage.removeItem('pharmacienToken');
    localStorage.removeItem('pharmacien');
    localStorage.clear();
    window.location.href = '/login';
  };

  const navItems = [
    { to: '/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={17} /> },
    { to: '/scanner', label: 'Délivrance / Vente', icon: <ScanBarcode size={17} /> },
    { to: '/patients', label: 'Carnet Patients', icon: <Activity size={17} /> },
    { to: '/stock', label: 'Gestion des Stocks', icon: <PackageSearch size={17} /> },
    { to: '/mouvements', label: 'Rapports & Mouvements', icon: <FileText size={17} /> },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 ease-out ${
      scrolled ? 'bg-white/85 backdrop-blur-xl shadow-lg py-2' : 'bg-white py-3'
    } border-b border-slate-200/60 w-full`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 gap-3">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div 
              className="flex items-center gap-2.5 cursor-pointer group transition-transform duration-300 active:scale-95" 
              onClick={() => navigate('/dashboard')}
            >
              <div className="bg-gradient-to-tr from-green-500 via-emerald-500 to-teal-400 p-2.5 rounded-2xl shadow-md shadow-green-500/20 group-hover:rotate-6 transition-transform duration-300">
                <Activity className="text-white" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-slate-800 tracking-tight leading-none group-hover:text-green-600 transition-colors">
                  Medi<span className="text-green-600">Pharma</span>
                </span>
                <span className="text-[9px] text-green-600 font-bold uppercase tracking-widest bg-green-50 border border-green-100 w-fit px-2 py-0.5 rounded-full mt-0.5 truncate max-w-[180px]">
                  {pharmacien.pharmacyName || 'PHARMACIE'}
                </span>
              </div>
            </div>

            {/* Horloge */}
            <div className="hidden 2xl:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl shadow-inner">
              <span className="text-xs font-black text-green-600 font-mono tracking-tight">
                {currentTime.toLocaleTimeString('fr-FR')}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 mx-0.5"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>

          {/* Capsule de Navigation Élastique */}
          <div className="hidden lg:flex items-center flex-1 max-w-fit mx-auto bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/70 shadow-inner overflow-x-auto no-scrollbar scroll-smooth transition-all duration-300">
            <div className="flex items-center gap-1 xl:gap-1.5 w-full">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all duration-300 whitespace-nowrap select-none
                    ${isActive 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md shadow-green-500/25 scale-[1.02]' 
                      : 'text-slate-600 hover:text-green-600 hover:bg-white/80 hover:scale-[1.02]'}
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Profile & Actions */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="text-right hidden xl:block">
                <p className="font-extrabold text-slate-900 text-xs xl:text-sm leading-tight">{pharmacien.name}</p>
                <p className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">{pharmacien.email || 'pharmacie@mediflow.com'}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-black shadow-md border border-white flex-shrink-0 transition-transform hover:scale-105 cursor-pointer">
                {initials}
              </div>
            </div>

            {/* Bouton Déconnexion Élastique */}
            <button 
              onClick={handleLogout}
              title="Déconnexion"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 font-bold text-xs xl:text-sm shadow-sm hover:shadow-lg hover:shadow-red-500/25 hover:scale-105 active:scale-95 flex-shrink-0 ml-1"
            >
              <LogOut size={16} />
              <span>Déconnexion</span>
            </button>
          </div>

          {/* Mobile Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 p-4 space-y-2 animate-in slide-in-from-top-4 duration-300 shadow-2xl">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 p-3.5 rounded-2xl text-sm font-bold transition-all
                ${isActive ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full p-3.5 rounded-2xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all duration-300 mt-4 shadow-sm"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      )}
    </nav>
  );
}