import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Users2,
  FileText,
  LogOut,
  Activity,
  Menu,
  X,
  Bell
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

  const storedUser = JSON.parse(localStorage.getItem('caissier') || 'null');
  const user = storedUser || { name: 'Caissier', role: 'CAISSIER' };
  
  const nameParts = (user.name || 'Utilisateur').split(' ');
  const initials = nameParts.length > 1 
    ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase()
    : `${nameParts[0].charAt(0)}${nameParts[0].charAt(1) || ''}`.toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('caissierToken');
    localStorage.removeItem('caissier');
    localStorage.clear();
    window.location.href = '/login';
  };

  const navItems = [
    { to: '/dashboard', label: 'Accueil', icon: <LayoutDashboard size={17} /> },
    { to: '/paiement', label: 'Paiements', icon: <CreditCard size={17} /> },
    { to: '/labo', label: 'Laboratoire', icon: <FileText size={17} /> },
    { to: '/file-attente', label: 'File d\'attente', icon: <Users2 size={17} /> },
    { to: '/consultations-terminees', label: 'Historique', icon: <FileText size={17} /> },
    { to: '/mouvements', label: 'Mouvements', icon: <Activity size={17} /> },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 ease-out ${
      scrolled ? 'bg-white/85 backdrop-blur-xl shadow-lg py-2' : 'bg-white py-3'
    } border-b border-slate-200/60 w-full`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 gap-3">
          
          {/* Brand Identity & Live Time */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div 
              className="flex items-center gap-2.5 cursor-pointer group transition-transform duration-300 active:scale-95" 
              onClick={() => navigate('/dashboard')}
            >
              <div className="bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-2.5 rounded-2xl shadow-md shadow-emerald-500/20 group-hover:rotate-6 transition-transform duration-300">
                <Activity className="text-white" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-slate-800 tracking-tight leading-none group-hover:text-emerald-600 transition-colors">
                  Medi<span className="text-emerald-600">Flow</span>
                </span>
                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 border border-emerald-100 w-fit px-2 py-0.5 rounded-full mt-0.5">
                  {user.hospitalName || 'HÔPITAL CAISSE'}
                </span>
              </div>
            </div>

            {/* Horloge / Date en temps réel */}
            <div className="hidden 2xl:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl shadow-inner">
              <span className="text-xs font-black text-emerald-600 font-mono tracking-tight">
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
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]'
                      : 'text-slate-600 hover:text-emerald-600 hover:bg-white/80 hover:scale-[1.02]'}
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
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-7 w-px bg-slate-200"></div>

            <div className="flex items-center gap-2.5 pl-1">
              <div className="text-right hidden xl:block">
                <p className="font-extrabold text-slate-900 text-xs xl:text-sm leading-tight">{user.name}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email || 'caisse@mediflow.com'}</span>
                  <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded-full">
                    {user.role}
                  </span>
                </div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-xs font-black shadow-md border border-white flex-shrink-0 transition-transform hover:scale-105 cursor-pointer">
                {initials || 'CS'}
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
          </div>

          {/* Mobile Button */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
              {initials}
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all">
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 p-4 space-y-2 animate-in slide-in-from-top-4 duration-300 shadow-2xl">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 p-3.5 rounded-2xl text-sm font-bold transition-all
                ${isActive ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}
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