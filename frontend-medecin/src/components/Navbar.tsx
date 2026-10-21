import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  LogOut, 
  Activity,
  Menu,
  X,
  Clock
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const doctor = JSON.parse(localStorage.getItem('medecin') || '{"name": "Dr. Médecin"}');
  const initials = doctor.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'MD';

  const handleLogout = () => {
    localStorage.removeItem('medecinToken');
    localStorage.removeItem('medecin');
    localStorage.clear();
    window.location.href = '/login';
  };

  const navItems = [
    { to: '/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={17} /> },
    { to: '/appointments', label: 'Mes RDV', icon: <Calendar size={17} /> },
    { to: '/patients', label: 'Patients', icon: <Users size={17} /> },
    { to: '/file-attente', label: 'File d’attente', icon: <Users size={17} /> },
    { to: '/consultations', label: 'Mes Consultations', icon: <FileText size={17} /> },
    { to: '/labo', label: 'Boîte Labo', icon: <FileText size={17} /> },
    { to: '/disponibilites', label: 'Disponibilités', icon: <Clock size={17} /> },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 ease-out ${scrolled ? 'bg-white/85 backdrop-blur-xl shadow-lg py-2' : 'bg-white py-3'} border-b border-slate-200/60 w-full`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 gap-3">
          
          {/* Logo + Horloge */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div 
              className="flex items-center gap-2.5 cursor-pointer group transition-transform duration-300 active:scale-95" 
              onClick={() => navigate('/dashboard')}
            >
              <div className="bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 p-2.5 rounded-2xl shadow-md shadow-indigo-500/20 group-hover:rotate-6 transition-transform duration-300">
                <Activity className="text-white" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-slate-800 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                  MediFlow
                </span>
                <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest bg-indigo-50 border border-indigo-100 w-fit px-2 py-0.5 rounded-full mt-0.5">
                  {doctor.hospitalName || 'HÔPITAL'}
                </span>
              </div>
            </div>

            {/* Horloge dynamique */}
            <div className="hidden 2xl:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl shadow-inner">
              <Calendar className="text-indigo-500" size={14} />
              <span className="text-xs font-bold text-slate-600">
                {currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 mx-0.5"></span>
              <span className="text-xs font-black text-indigo-600 font-mono tracking-tight">
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]' 
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-white/80 hover:scale-[1.02]'}
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Profil + Déconnexion */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="text-right hidden xl:block">
                <p className="font-extrabold text-slate-900 text-xs xl:text-sm leading-tight">{doctor.name}</p>
                <p className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">{doctor.email || 'medecin@mediflow.com'}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white text-xs font-black shadow-md shadow-indigo-500/20 flex-shrink-0 transition-transform hover:scale-105 cursor-pointer">
                {initials}
              </div>
            </div>

            {/* Bouton Déconnexion Élastique */}
            <button 
              onClick={handleLogout}
              title="Déconnexion"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 font-bold text-xs xl:text-sm shadow-sm hover:shadow-lg hover:shadow-red-500/25 hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <LogOut size={16} />
              <span>Déconnexion</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu avec animation fluide */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 p-4 space-y-2 animate-in slide-in-from-top-4 duration-300">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 p-3.5 rounded-2xl text-sm font-bold transition-all
                ${isActive ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}
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