import { useEffect, useState } from 'react';
import { UserCheck, PhoneCall, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../services/api';
import DossierMedicalModal from './DossierMedicalModal';

export default function FileAttenteMedecin() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);

  // Modal de consultation
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showConsultModal, setShowConsultModal] = useState(false);

  useEffect(() => {
    const medecinData = localStorage.getItem('medecin');
    if (medecinData) setDoctor(JSON.parse(medecinData));
  }, []);

  const fetchMyQueue = async () => {
    if (!doctor?.id) return;
    try {
      const res = await api.get(`/queue/doctor/${doctor.id}`);
      setTickets(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctor?.id) {
      fetchMyQueue();
      const interval = setInterval(fetchMyQueue, 3000);
      return () => clearInterval(interval);
    }
  }, [doctor]);

  // Appeler le prochain patient + notifier le patient
  const callNext = async () => {
    if (!doctor?.id) return;
    try {
      const res = await api.post('/queue/call-next', { doctorId: doctor.id });
      alert(res.data.message || 'Patient appelé !');

      // Notification simulée pour le patient (visible dans sa file d'attente)
      console.log(`📢 Notification envoyée au patient : C'est votre tour chez Dr. ${doctor.name}`);

      if (res.data.ticket) {
        setSelectedTicket(res.data.ticket);
        setShowConsultModal(true);
      }

      fetchMyQueue();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Aucun patient en attente');
    }
  };

  // Commencer la consultation (ouvre le formulaire + change statut)
  const startConsultation = async (ticket: any) => {
    try {
      await api.put(`/queue/ticket/${ticket.id}`, { status: 'in_progress' });
      
      setSelectedTicket(ticket);
      setShowConsultModal(true);
      
      fetchMyQueue();
    } catch (err) {
      alert('Erreur lors du démarrage de la consultation');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[500px]">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 animate-in fade-in duration-500 h-full flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 shrink-0">
        <div>
          <h2 className="text-4xl font-black flex items-center gap-4 text-slate-800">
            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
              <UserCheck size={36} />
            </div>
            Ma File d’Attente
          </h2>
          <p className="text-slate-500 text-lg mt-2 font-medium">Gérez le flux de vos patients en temps réel.</p>
        </div>

        <button
          onClick={callNext}
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all shrink-0"
        >
          <PhoneCall size={24} className="animate-pulse" />
          Appeler le prochain patient
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-wider text-sm">Ticket</th>
                <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-wider text-sm">Patient</th>
                <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-wider text-sm">Horaire RDV</th>
                <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-wider text-sm text-center">Statut</th>
                <th className="px-8 py-6 font-bold text-slate-500 uppercase tracking-wider text-sm text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-24">
                    <UserCheck className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 text-lg font-medium">Aucun patient en attente pour le moment</p>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-3xl text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                          #{ticket.ticketNumber}
                        </span>
                        {ticket.isEmergency && (
                          <span className="animate-bounce text-2xl" title="Urgence">🚨</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-slate-800">
                          {ticket.patient.firstName} {ticket.patient.lastName}
                        </span>
                        {ticket.appointment?.status === 'rescheduled' && (
                          <span className="text-[11px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md w-fit mt-1 flex items-center gap-1">
                            🔄 Reprogrammé par le patient
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                        {ticket.appointment?.date 
                          ? new Date(ticket.appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                          : 'Non programmé'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                        ticket.status === 'in_progress' 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {ticket.status === 'in_progress' ? 'En consultation' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {ticket.status === 'waiting' && (
                        <button
                          onClick={() => startConsultation(ticket)}
                          className="inline-flex bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <CheckCircle2 size={20} />
                          Démarrer
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showConsultModal && selectedTicket && (
        <DossierMedicalModal 
          patientId={selectedTicket.patient.id}
          patientName={`${selectedTicket.patient.firstName} ${selectedTicket.patient.lastName}`}
          ticketId={selectedTicket.id}
          onClose={() => setShowConsultModal(false)}
          onSuccess={() => {
            setShowConsultModal(false);
            fetchMyQueue();
          }}
        />
      )}
    </div>
  );
}