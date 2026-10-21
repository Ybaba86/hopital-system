import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Stethoscope, 
  UserCog, 
  Activity, 
  BarChart3,
  LogOut,
  X,
  Users,
  Cross,
  Microscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function SidebarAdmin({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const adminStr = localStorage.getItem('admin');
  const admin = adminStr ? JSON.parse(adminStr) : null;

  const menuItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
    { to: "/admin/hospitals", icon: Building2, label: "Hôpitaux" },
    { to: "/admin/pharmacies", icon: Cross, label: "Pharmacies" },
    { to: "/admin/laboratories", icon: Microscope, label: "Laboratoires" },
    { to: "/admin/doctors", icon: Stethoscope, label: "Médecins" },
    { to: "/admin/users", icon: UserCog, label: "Utilisateurs" },
    { to: "/admin/patients", icon: Users, label: "Patients" },
    { to: "/admin/services", icon: Activity, label: "Services" },
    { to: "/admin/reports", icon: BarChart3, label: "Rapports" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/admin/login');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Sidebar */}
      <aside className={`fixed top-4 left-4 bottom-4 w-64 glass-dark text-slate-300 z-50 rounded-[2rem] transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30">
              {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight truncate w-32" title={admin?.name || 'Administrateur'}>
                {admin?.name || 'Administrateur'}
              </h1>
              <span className="text-xs text-blue-400 font-medium tracking-wide uppercase">Admin</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 no-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Menu Principal</p>
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl"></div>
                )}
                <item.icon size={20} className={`relative z-10 transition-transform duration-300 ${isActive ? 'text-blue-400 scale-110' : 'group-hover:scale-110'}`} />
                <span className="relative z-10 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-medium group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
