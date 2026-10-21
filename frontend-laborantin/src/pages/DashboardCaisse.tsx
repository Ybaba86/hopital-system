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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black">Tableau de bord Caisse</h1>
          <p className="text-slate-500 mt-1">Vue d'ensemble en temps réel</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Dernière mise à jour</p>
          <p className="font-medium">{new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
      </div>

      {/* Cartes principales - CLIQUABLES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Recettes du jour */}
        <div 
          onClick={() => navigate('/paiement')}
          className="bg-white rounded-3xl p-8 shadow-sm border hover:shadow-lg cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Recettes aujourd’hui</p>
              <p className="text-5xl font-black mt-3">{todayStats.total.toLocaleString()} FCFA</p>
            </div>
            <div className="bg-emerald-100 p-4 rounded-2xl">
              <Banknote className="text-emerald-600" size={40} />
            </div>
          </div>
        </div>

        {/* File d’attente */}
        <div 
          onClick={() => navigate('/file-attente')}
          className="bg-white rounded-3xl p-8 shadow-sm border hover:shadow-lg cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">En file d’attente</p>
              <p className="text-5xl font-black mt-3">{todayStats.waitingCount}</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-2xl">
              <Users className="text-orange-600" size={40} />
            </div>
          </div>
        </div>

        {/* Paiements en attente → Redirige vers Facturation */}
        <div 
          onClick={() => navigate('/paiement')}
          className="bg-white rounded-3xl p-8 shadow-sm border hover:shadow-lg cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Paiements en attente</p>
              <p className="text-5xl font-black mt-3">{todayStats.pendingPayments}</p>
            </div>
            <div className="bg-amber-100 p-4 rounded-2xl">
              <Clock className="text-amber-600" size={40} />
            </div>
          </div>
        </div>
      </div>

      {/* Statistique mensuelle */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="text-indigo-600" size={28} />
          <h3 className="text-xl font-bold">Recettes du mois ({monthlyStats.month})</h3>
        </div>
        <p className="text-6xl font-black text-indigo-600">{monthlyStats.total.toLocaleString()} FCFA</p>
      </div>
    </div>
  );
}