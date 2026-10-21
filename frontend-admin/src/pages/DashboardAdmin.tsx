import {
  Users,
  BarChart3,
  Stethoscope,
  Calendar,
  TrendingUp,
  MoreHorizontal,
  Zap,
  Target,
  Award,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AddAppointmentModal from '../components/AddAppointmentModal';

export default function DashboardAdmin() {
  const [statsData, setStatsData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [resStats, resReports] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/reports')
      ]);
      setStatsData(resStats.data);
      setChartData(resReports.data.monthlyActivity);
    } catch (error) {
      console.error("Erreur de chargement du dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (!amount) return '0 FCFA';
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M FCFA';
    }
    return amount.toLocaleString('fr-FR') + ' FCFA';
  };

  const stats = [
    { icon: Users, label: "Patients", value: statsData?.totalPatients || 0, trend: "+12%", bg: "bg-gradient-to-br from-blue-500 to-blue-600", color: "text-white" },
    { icon: Stethoscope, label: "Médecins", value: statsData?.totalDoctors || 0, trend: "+8%", bg: "bg-white", color: "text-slate-800" }, 
    { icon: BarChart3, label: "Rendez-vous", value: statsData?.totalAppointments || 0, trend: "+22%", bg: "bg-slate-900", color: "text-white" },
    { icon: TrendingUp, label: "Chiffre d'Affaires", value: formatCurrency(statsData?.totalRevenue || 0), trend: "+15%", bg: "bg-emerald-500", color: "text-white" },
  ];

  const activities = statsData?.recentActivities || [];

  const appointments = statsData?.todayAppointments || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vue d'ensemble</h2>
          <p className="text-slate-500 font-medium mt-1">Voici ce qui se passe dans vos établissements aujourd'hui.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm hover:shadow-md">
            Exporter
          </button>
          <button 
            onClick={() => navigate('/admin/reports')}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30"
          >
            Nouveau Rapport
          </button>
        </div>
      </div>

      {/* Bento Grid - Top Row */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={`bento-card ${stat.bg} ${stat.color} relative overflow-hidden group`}>
            {stat.bg !== 'bg-white' && (
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            )}
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg === 'bg-white' ? 'bg-slate-100 text-slate-600' : 'bg-white/20 text-white'} backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${stat.bg === 'bg-white' ? 'bg-emerald-50 text-emerald-600' : 'bg-white/20 text-white backdrop-blur-sm'}`}>
                <TrendingUp size={14} /> {stat.trend}
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black mb-1 tracking-tight">{stat.value}</p>
              <p className={`text-sm font-semibold ${stat.bg === 'bg-white' ? 'text-slate-500' : 'text-white/80'}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bento Grid - Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Area */}
        <div className="bento-card lg:col-span-2 min-h-[320px] flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-xl font-extrabold text-slate-900">Activité Globale (Rendez-vous)</h3>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="flex-1 w-full min-h-[250px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="consultations" name="Consultations" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="urgences" name="Urgences" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI List */}
        <div className="bento-card flex flex-col gap-4">
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">Objectifs</h3>
          
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 group hover:bg-yellow-500/20 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500 text-white flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-yellow-600/80 uppercase tracking-wider mb-0.5">Taux de Performance</p>
              <p className="text-xl font-black text-slate-900">98.4%</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 group hover:bg-emerald-500/20 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Target size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600/80 uppercase tracking-wider mb-0.5">Objectifs Mensuels</p>
              <p className="text-xl font-black text-slate-900">92% atteint</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 group hover:bg-blue-500/20 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <Award size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600/80 uppercase tracking-wider mb-0.5">Satisfaction Patient</p>
              <p className="text-xl font-black text-slate-900">4.8 <span className="text-slate-400 text-base font-bold">/ 5</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid - Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Activités */}
        <div className="bento-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-slate-900">Activités Récentes</h3>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              Voir tout <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((act: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                  <div className={`w-12 h-12 rounded-2xl ${act.bg} ${act.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {act.icon === 'Users' ? <Users size={20} /> : <Calendar size={20} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{act.title}</p>
                    <p className="text-sm text-slate-500">{act.desc}</p>
                  </div>
                  <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl">
                    {act.time}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Aucune activité récente.</p>
            )}
          </div>
        </div>

        {/* Agenda */}
        <div className="bento-card bg-slate-900 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold">Agenda d'Aujourd'hui</h3>
            <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          
          <div className="relative z-10 space-y-4">
            {appointments.length > 0 ? (
              appointments.map((app: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm">
                  <div className="w-16 text-center">
                    <p className="font-black text-lg">{app.time}</p>
                  </div>
                  <div className={`w-1 h-10 rounded-full ${app.color}`}></div>
                  <div>
                    <p className="font-bold text-white">{app.patient}</p>
                    <p className="text-sm text-slate-400 font-medium">{app.type}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-white/70">
                <p className="font-bold">Aucun rendez-vous aujourd'hui</p>
                <p className="text-sm">Votre journée est libre !</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="relative z-10 mt-6 w-full py-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-50 transition-colors text-sm font-extrabold shadow-xl"
          >
            Ajouter un Rendez-vous
          </button>
        </div>
      </div>
      
      <AddAppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Recharger les données du dashboard après l'ajout d'un RDV
          fetchData();
        }}
      />
      </>
      )}
    </div>
  );
}