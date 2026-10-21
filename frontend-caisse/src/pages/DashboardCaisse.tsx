import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Users, Clock, Calendar, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function DashboardCaisse() {
  const [todayStats, setTodayStats] = useState({
    total: 0,
    waitingCount: 0,
    pendingPayments: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    month: '',
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [dailyRes, queueRes, pendingRes, monthlyRes] = await Promise.all([
        api.get('/payments/daily'),
        api.get('/queue/waiting'),
        api.get('/appointments/pending-payments'),
        api.get('/payments/monthly'),
      ]);

      setTodayStats({
        total: dailyRes.data.total || 0,
        waitingCount: queueRes.data.length || 0,
        pendingPayments: pendingRes.data.length || 0,
      });

      setMonthlyStats({
        total: monthlyRes.data.total || 0,
        month: `${monthlyRes.data.month}/${monthlyRes.data.year}`,
      });
    } catch (error) {
      console.error("Erreur chargement dashboard caisse:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
        <p className="text-slate-500 font-medium">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <div className="bg-emerald-100 p-3 rounded-2xl">
          <Banknote className="text-emerald-600" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tableau de bord Caisse</h1>
          <p className="text-slate-500 mt-1 font-medium">Aperçu général des recettes et des files d'attente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recettes du jour */}
        <div 
          onClick={() => navigate('/paiement')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-slate-500 uppercase">Recettes du jour</p>
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
              <Banknote size={24} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800">
            {todayStats.total.toLocaleString()} <span className="text-lg font-bold text-slate-400">FCFA</span>
          </h3>
        </div>

        {/* File d'attente */}
        <div 
          onClick={() => navigate('/file-attente')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-slate-500 uppercase">File d'attente</p>
            <div className="bg-orange-100 p-3 rounded-xl text-orange-600 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800">
            {todayStats.waitingCount} <span className="text-lg font-bold text-slate-400">patients</span>
          </h3>
        </div>

        {/* Paiements en attente */}
        <div 
          onClick={() => navigate('/paiement')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group border-l-4 border-l-amber-500"
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-amber-600 uppercase">En attente de paiement</p>
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-amber-600">
            {todayStats.pendingPayments} <span className="text-lg font-bold text-amber-400">dossiers</span>
          </h3>
        </div>
      </div>

      {/* Statistique mensuelle */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl shadow-xl p-8 flex flex-col justify-center relative overflow-hidden text-white mt-8">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Calendar size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-emerald-400 uppercase tracking-wider">Recettes du mois ({monthlyStats.month})</h3>
          </div>
          <p className="text-4xl font-black mt-1">
            {monthlyStats.total.toLocaleString()} <span className="text-xl font-bold text-emerald-400/70">FCFA</span>
          </p>
        </div>
      </div>
    </div>
  );
}