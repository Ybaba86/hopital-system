import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  ChevronDown, 
  Menu, 
  X, 
  LogOut, 
  Home, 
  CalendarPlus, 
  Calendar, 
  BookOpen, 
  Receipt, 
  Pill, 
  ClipboardList, 
  Clock,
  Building2
} from 'lucide-react';
import api from '../services/api';

export default function LayoutPatient() {
  const navigate = useNavigate();
  const location = useLocation();
  const [patient, setPatient] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedPatient = localStorage.getItem('patient');
    if (storedPatient) {
      setPatient(JSON.parse(storedPatient));
    }
    
    api.get('/hospitals').then(res => setHospitals(res.data)).catch(console.error);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fermer le menu mobile lors d'un changement de route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('patientToken');
    localStorage.removeItem('patient');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Accueil', icon: Home },
    { to: '/take-appointment', label: 'Prendre RDV', icon: CalendarPlus },
    { to: '/rendez-vous', label: 'Mes RDV', icon: Calendar },
    { to: '/carnet', label: 'Mon Carnet', icon: BookOpen },
    { to: '/recus', label: 'Mes Reçus', icon: Receipt },
    { to: '/ordonnances', label: 'Ordonnances', icon: Pill },
    { to: '/resultats', label: 'Résultats Examens Médicaux', icon: ClipboardList },
    { to: '/file-attente', label: "File d'attente", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16 lg:pb-0">
      
      {/* HEADER RESPONSIVE */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white sticky top-0 z-40 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          
          {/* Hôpital et Horloge */}
          <div className="flex flex-col min-w-0">
            <div className="relative group flex items-center max-w-[220px] sm:max-w-xs">
              <Building2 size={16} className="text-blue-200 mr-1.5 shrink-0" />
              <select
                value={patient?.hospitalId || ''}
                onChange={async (e) => {
                  const newId = e.target.value;
                  const newName = e.target.options[e.target.selectedIndex].text;
                  if (!newId || !patient) return;
                  try {
                    await api.put(`/patients/${patient.id}`, { hospitalId: newId });
                    const updatedPatient = { ...patient, hospitalId: newId, hospitalName: newName };
                    setPatient(updatedPatient);
                    localStorage.setItem('patient', JSON.stringify(updatedPatient));
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                    alert("Erreur lors du changement d'hôpital");
                  }
                }}
                className="text-sm sm:text-base font-black bg-transparent border-none text-white focus:ring-0 cursor-pointer appearance-none outline-none hover:text-blue-200 transition-colors pr-6 truncate"
              >
                {!patient?.hospitalId && <option value="">-- Choisir un Hôpital --</option>}
                {hospitals.map(h => (
                  <option key={h.id} value={h.id} className="text-slate-800 text-sm">{h.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-blue-200" />
            </div>
            <span className="text-[11px] sm:text-xs text-blue-200 truncate hidden sm:block">
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} • {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Droite: Profil, Déconnexion et Bouton Hamburger Mobile */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
              <div className="bg-white/20 p-1 rounded-full">
                <User size={14} className="text-white" />
              </div>
              <span className="font-bold text-xs sm:text-sm truncate max-w-[140px]">
                {patient?.firstName} {patient?.lastName}
              </span>
            </div>

            <button 
              onClick={handleLogout} 
              className="hidden lg:flex items-center gap-1.5 bg-red-500/90 hover:bg-red-600 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Déconnexion"
            >
              <LogOut size={14} />
              <span>Déconnexion</span>
            </button>

            {/* Bouton Hamburger pour Mobile & Tablette */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* MENU DÉROULANT MOBILE */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-blue-800/95 backdrop-blur-xl border-t border-blue-500/30 px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200 max-h-[80vh] overflow-y-auto">
            {/* Profil sur mobile */}
            <div className="p-3 bg-white/10 rounded-2xl flex items-center justify-between mb-3 border border-white/15">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white font-black text-sm">
                  {patient?.firstName?.[0] || 'P'}
                </div>
                <div>
                  <p className="font-bold text-sm text-white leading-tight">{patient?.firstName} {patient?.lastName}</p>
                  <p className="text-[11px] text-blue-200">{patient?.phone || 'Patient'}</p>
                </div>
              </div>
              <span className="text-xs font-black bg-blue-900/60 text-blue-200 px-2 py-1 rounded-lg">
                {patient?.bloodGroup || 'Sanguin: ?'}
              </span>
            </div>

            <p className="text-[11px] font-black uppercase text-blue-300 tracking-wider px-2">Navigation</p>
            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all
                      ${isActive 
                        ? 'bg-white text-blue-800 shadow-md' 
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition-colors mt-3"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        )}
      </header>

      {/* NAVIGATION HORIZONTALE DESKTOP */}
      <nav className="hidden lg:flex bg-white shadow-sm border-b border-slate-200/80 px-4 py-2.5 justify-center gap-2 overflow-x-auto whitespace-nowrap print:hidden sticky top-[57px] z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={({ isActive }) => 
                `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* BARRE DE NAVIGATION BASSE SUR MOBILE (Bottom Navigation Bar) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 flex justify-around items-center z-40 shadow-lg print:hidden">
        {[
          { to: '/dashboard', label: 'Accueil', icon: Home },
          { to: '/take-appointment', label: 'Nouveau RDV', icon: CalendarPlus },
          { to: '/rendez-vous', label: 'Mes RDV', icon: Calendar },
          { to: '/carnet', label: 'Carnet', icon: BookOpen },
          { to: '/resultats', label: 'Examens', icon: ClipboardList },
        ].map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all min-w-[55px]
                ${isActive ? 'text-blue-600 scale-105' : 'text-slate-500 hover:text-slate-800'}
              `}
            >
              <Icon size={20} className="mb-0.5" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
}