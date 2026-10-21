import { useEffect, useState } from 'react';
import { Calendar, Pill, ClipboardList, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function DashboardPatient() {
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    consultations: 0,
    prescriptions: 0,
    labResults: 0,
  });

  useEffect(() => {
    const stored = localStorage.getItem('patient');
    if (stored) setPatient(JSON.parse(stored));

    const fetchStats = async () => {
      try {
        const [presRes, labRes, aptRes] = await Promise.all([
          api.get('/patient/prescriptions').catch(() => ({ data: [] })),
          api.get('/patient/lab-results').catch(() => ({ data: [] })),
          api.get('/appointments/my').catch(() => ({ data: [] })),
        ]);

        setStats({
          consultations: aptRes.data.length || 0,
          prescriptions: presRes.data.length || 0,
          labResults: labRes.data.length || 0,
        });
      } catch (error) {
        console.error("Erreur API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { 
      title: 'Consultations', 
      count: stats.consultations, 
      icon: Calendar, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      link: '/rendez-vous' 
    },
    { 
      title: 'Ordonnances', 
      count: stats.prescriptions, 
      icon: Pill, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-100',
      link: '/ordonnances' 
    },
    { 
      title: 'Résultats Examens Médicaux', 
      count: stats.labResults, 
      icon: ClipboardList, 
      color: 'text-purple-600', 
      bg: 'bg-purple-100',
      link: '/resultats' 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="max-w-6xl mx-auto p-3 sm:p-6 md:p-10">
        <header className="mb-6 sm:mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-14 w-14 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center text-white text-2xl font-black">
              {patient?.firstName?.[0] || 'P'}
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Bonjour, {patient?.firstName} {patient?.lastName}
              </h2>
              <p className="text-slate-500 italic">Heureux de vous revoir sur votre espace santé.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {cards.map((card, i) => (
            <Link 
              key={i} 
              to={card.link}
              className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-300 cursor-pointer block"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon size={26} />
                </div>
                <span className="text-slate-300 group-hover:text-blue-500 transition-colors">
                  <ArrowRight size={20} />
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
                {loading ? (
                  <div className="h-9 w-16 bg-slate-100 animate-pulse rounded mt-2" />
                ) : (
                  <p className="text-4xl font-black mt-1 text-slate-800">{card.count}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-blue-200">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">Besoin d'un rendez-vous ?</h3>
            <p className="text-blue-100 max-w-md">Réservez une consultation avec votre médecin traitant ou un spécialiste en quelques secondes.</p>
          </div>
          <Link 
            to="/rendez-vous" 
            className="bg-white text-blue-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all shadow-md active:scale-90 whitespace-nowrap inline-block text-center"
          >
            Prendre rendez-vous
          </Link>
        </section>
      </main>
    </div>
  );
}