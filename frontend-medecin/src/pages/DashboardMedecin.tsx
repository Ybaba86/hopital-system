import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, Activity, ChevronRight, Loader2 } from 'lucide-react';
import api from '../services/api';
import DossierMedicalModal from './DossierMedicalModal';

export default function DashboardMedecin() {
  const [doctor, setDoctor] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const medecinData = localStorage.getItem('medecin');
    if (medecinData) {
      const parsed = JSON.parse(medecinData);
      setDoctor(parsed);
    }
  }, []);

  // Charger les rendez-vous du médecin
  const fetchDoctorData = async () => {
    if (!doctor?.id) return;
    try {
      const [appRes, queueRes] = await Promise.all([
        api.get(`/appointments/doctor/${doctor.id}`),
        api.get(`/queue/doctor/${doctor.id}/count`)
      ]);

      // Filtrer les RDV du jour (optionnel)
      const todayAppointments = appRes.data.filter((apt: any) => {
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === new Date().toDateString();
      });

      setAppointments(todayAppointments.length > 0 ? todayAppointments : appRes.data.slice(0, 5));
      setQueueCount(queueRes.data.waitingCount || 0);
    } catch (error) {
      console.error("Erreur chargement dashboard médecin:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctor?.id) {
      fetchDoctorData();
      const interval = setInterval(fetchDoctorData, 10000);
      return () => clearInterval(interval);
    }
  }, [doctor]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-10 animate-in fade-in duration-500 h-full overflow-y-auto">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Activity size={200} />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
            Bonjour, Dr. {doctor?.name || 'Médecin'}
          </h1>
          <p className="text-indigo-200 text-lg max-w-xl">
            Voici l'état de votre cabinet aujourd'hui. Vous avez {appointments.length} rendez-vous et {queueCount} patients en attente.
          </p>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 font-medium">Rendez-vous aujourd'hui</p>
              <p className="text-5xl font-black mt-2 text-slate-800">{appointments.length}</p>
            </div>
            <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Calendar size={32} />
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/file-attente')}
          className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white flex flex-col justify-between group hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 font-medium">Patients en file d'attente</p>
              <p className="text-5xl font-black mt-2 text-orange-600">{queueCount}</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-2xl text-orange-600 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all">
              <Users size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 font-medium">Statut du cabinet</p>
              <p className="text-2xl font-bold mt-4 text-emerald-600 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                En consultation
              </p>
            </div>
            <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Activity size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Prochains rendez-vous */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
              <Clock size={24} />
            </div>
            Prochains rendez-vous
          </h3>
          <a href="/file-attente" className="text-indigo-600 font-bold bg-indigo-50 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-100 transition-colors">
            Voir la file d'attente <ChevronRight size={18} />
          </a>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <Clock className="mx-auto text-slate-300 mb-3" size={48} />
            <p className="text-slate-500 font-medium text-lg">Aucun rendez-vous programmé pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt: any) => (
              <div key={apt.id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="bg-gradient-to-tr from-indigo-100 to-blue-50 text-indigo-700 w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black border border-indigo-200/50 group-hover:from-indigo-600 group-hover:to-blue-500 group-hover:text-white transition-all">
                    <span className="text-2xl leading-none">{new Date(apt.date).getDate()}</span>
                    <span className="text-[10px] uppercase tracking-wider">{new Date(apt.date).toLocaleDateString('fr-FR', {month: 'short'})}</span>
                  </div>
                  <div>
                    <p className="font-black text-xl text-slate-800">
                      {apt.patient?.firstName} {apt.patient?.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
                      <Clock size={16} className="text-indigo-400" />
                      {new Date(apt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedAppointment(apt);
                    setShowConsultModal(true);
                  }}
                  className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex justify-center"
                >
                  Ouvrir dossier
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {showConsultModal && selectedAppointment && (
        <DossierMedicalModal 
          patientId={selectedAppointment.patient.id}
          patientName={`${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}`}
          onClose={() => setShowConsultModal(false)}
          onSuccess={() => {
            setShowConsultModal(false);
            fetchDoctorData();
          }}
        />
      )}
    </div>
  );
}