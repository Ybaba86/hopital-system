import { useEffect, useState } from 'react';
import { Phone, User, Crown, Home, Clock, RefreshCw, Calendar, FileText } from 'lucide-react';
import api from '../services/api';
import DossierMedicalModal from './DossierMedicalModal';

interface Appointment {
  id: string;
  date: string;
  status: string;
  paymentStatus: string;
  isVip?: boolean;
  locationType?: string;
  homeAddress?: string;
  isRescheduled?: boolean;
  diffDays?: number;
  isPast7Days?: boolean;
  daysRemaining?: number;
  canReschedule?: boolean;
  patient: { 
    id: string; 
    firstName: string; 
    lastName: string; 
    phone: string;
  };
  doctor: { name: string };
}

export default function RendezVousMedecin() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'rescheduled' | 'upcoming'>('all');

  // Consultation modal
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [showConsultModal, setShowConsultModal] = useState(false);

  // Récupérer les infos du médecin connecté
  useEffect(() => {
    const medecinData = localStorage.getItem('medecin');
    if (medecinData) {
      setDoctor(JSON.parse(medecinData));
    }
  }, []);

  const fetchDoctorAppointments = async () => {
    if (!doctor?.id) return;
    try {
      const res = await api.get(`/appointments/doctor/${doctor.id}`);
      setAppointments(res.data);
    } catch (error) {
      console.error('Erreur récupération RDV médecin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctor?.id) {
      fetchDoctorAppointments();
      const interval = setInterval(fetchDoctorAppointments, 8000);
      return () => clearInterval(interval);
    }
  }, [doctor]);

  if (loading) {
    return <div className="text-center py-12 font-bold text-slate-500">Chargement de vos rendez-vous...</div>;
  }

  const todayStr = new Date().toDateString();
  const rescheduledCount = appointments.filter(a => a.status === 'rescheduled' || a.isRescheduled).length;
  const todayCount = appointments.filter(a => new Date(a.date).toDateString() === todayStr).length;

  const filteredAppointments = appointments.filter(apt => {
    const aptDateStr = new Date(apt.date).toDateString();
    if (filterTab === 'today') return aptDateStr === todayStr;
    if (filterTab === 'rescheduled') return apt.status === 'rescheduled' || apt.isRescheduled;
    if (filterTab === 'upcoming') return new Date(apt.date) >= new Date();
    return true; // 'all'
  });

  return (
    <div className="max-w-6xl mx-auto w-full p-3 sm:p-6 min-h-full flex flex-col space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-3">
            <Calendar className="text-indigo-600" size={32} />
            <span>Gestion des Rendez-vous</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Visualisez vos rendez-vous, les reprogrammations des patients (délai 7 jours) et commencez les consultations.
          </p>
        </div>

        {/* Alerte si des reprogrammations sont reçues */}
        {rescheduledCount > 0 && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm animate-pulse">
            <RefreshCw size={18} className="text-amber-600" />
            <span className="text-sm font-black">
              {rescheduledCount} rendez-vous reprogrammé{rescheduledCount > 1 ? 's' : ''} reçu{rescheduledCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </header>

      {/* Onglets de filtrage */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            filterTab === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Tous ({appointments.length})
        </button>

        <button
          onClick={() => setFilterTab('today')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            filterTab === 'today'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Aujourd'hui ({todayCount})
        </button>

        <button
          onClick={() => setFilterTab('rescheduled')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            filterTab === 'rescheduled'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
              : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <RefreshCw size={14} className={rescheduledCount > 0 ? 'animate-spin' : ''} />
          Reprogrammés ({rescheduledCount})
        </button>

        <button
          onClick={() => setFilterTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            filterTab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          À venir
        </button>
      </div>
      
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200">
          <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium text-lg">
            Aucun rendez-vous dans cette catégorie.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 flex-1 overflow-y-auto pr-1">
          {filteredAppointments.map(apt => {
            const isRescheduled = apt.status === 'rescheduled' || apt.isRescheduled;
            const isCompleted = apt.status === 'completed';
            const isMissed = !isCompleted && !isRescheduled && (apt.status === 'missed' || (apt.status === 'scheduled' && new Date(apt.date) < new Date()));
            const isPaid = apt.paymentStatus === 'paid' || apt.paymentStatus === 'completed';

            return (
              <div 
                key={apt.id} 
                className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                  isRescheduled 
                    ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400' 
                    : isCompleted
                      ? 'bg-emerald-50/20 border-emerald-200'
                      : isMissed
                        ? 'border-rose-200 bg-rose-50/20'
                        : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex gap-4 items-start sm:items-center">
                  <div className={`h-16 w-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 font-bold uppercase ${
                    isRescheduled
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                      : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isMissed
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  }`}>
                    <span className="text-xl leading-none">{new Date(apt.date).getDate()}</span>
                    <span className="text-[10px] tracking-wider mt-0.5">{new Date(apt.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                        <User size={18} className="text-slate-400" /> 
                        {apt.patient.firstName} {apt.patient.lastName}
                      </h4>

                      {/* Badge Reprogrammé */}
                      {isRescheduled && (
                        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300 shadow-sm">
                          <RefreshCw size={12} className="animate-spin text-amber-700" /> Reprogrammé par le patient
                        </span>
                      )}

                      {apt.isVip && (
                        <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Crown size={12} /> Patient VIP
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone size={14}/> {apt.patient.phone || 'Non renseigné'}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        <Clock size={14} className="text-indigo-600" /> {new Date(apt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {apt.isVip && apt.locationType === 'home' && (
                        <span className="flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          <Home size={14}/> À domicile : {apt.homeAddress || 'Adresse patient'}
                        </span>
                      )}
                    </div>

                    {/* Règle des 7 jours */}
                    <div className="mt-2 text-xs font-medium text-slate-500 flex items-center gap-2">
                      <span className="text-slate-600">
                        Délai de validité consultation :
                      </span>
                      {apt.isPast7Days ? (
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Expiré (&gt; 7 jours)
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Jour {apt.diffDays ?? 0}/7 (Valide)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 self-end md:self-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isPaid ? 'Payé' : 'Sur place'}
                  </span>

                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : isRescheduled
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                        : isMissed 
                          ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                          : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isCompleted 
                      ? 'Consultation effectuée' 
                      : isRescheduled 
                        ? 'Reprogrammé' 
                        : isMissed 
                          ? 'Non présenté' 
                          : 'Programmé'}
                  </span>

                  {/* Bouton Consulter actif */}
                  {!isCompleted && (
                    <button 
                      onClick={() => {
                        setSelectedApt(apt);
                        setShowConsultModal(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <FileText size={16} /> Consulter
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CONSULTATION DU MÉDECIN */}
      {showConsultModal && selectedApt && (
        <DossierMedicalModal
          patientId={selectedApt.patient.id}
          patientName={`${selectedApt.patient.firstName} ${selectedApt.patient.lastName}`}
          onClose={() => {
            setShowConsultModal(false);
            setSelectedApt(null);
          }}
          onSuccess={() => {
            setShowConsultModal(false);
            setSelectedApt(null);
            fetchDoctorAppointments();
          }}
        />
      )}
    </div>
  );
}