import { useState, useEffect } from 'react';
import { BookOpen, Calendar, UserRound, Pill, Stethoscope, FileText, Loader2, Clock, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface SlotItem {
  time: string;
  isReserved?: boolean;
  isPast?: boolean;
  isAvailable?: boolean;
}

export default function CarnetMedical() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Reprogrammation
  const [rescheduleApt, setRescheduleApt] = useState<any | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const fetchCarnetData = async () => {
    try {
      const storedPatient = localStorage.getItem('patient');
      if (!storedPatient) return;
      const patientData = JSON.parse(storedPatient);

      const [consultRes, aptRes] = await Promise.all([
        api.get(`/consultations?patientId=${patientData.id}`).catch(() => ({ data: [] })),
        api.get('/appointments/my').catch(() => ({ data: [] }))
      ]);

      setConsultations(consultRes.data);
      setAppointments(aptRes.data);
    } catch (error) {
      console.error("Erreur chargement carnet:", error);
      toast.error("Impossible de charger votre carnet médical");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarnetData();
  }, []);

  // Créneaux pour la reprogrammation
  useEffect(() => {
    if (!rescheduleApt || !newDate) {
      setAvailableSlots([]);
      setNewTime('');
      return;
    }
    const docId = rescheduleApt.doctorId || rescheduleApt.doctor?.id;
    if (!docId) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setNewTime('');
      try {
        const res = await api.get(`/appointments/available-slots?doctorId=${docId}&date=${newDate}`);
        const data = Array.isArray(res.data) ? res.data : [];
        const normalized = data.map((item: any) => {
          if (typeof item === 'string') {
            return { time: item, isReserved: false, isPast: false, isAvailable: true };
          }
          return item;
        });
        setAvailableSlots(normalized);
      } catch (err) {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [rescheduleApt, newDate]);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApt || !newDate || !newTime) {
      toast.error("Veuillez choisir une date et une heure");
      return;
    }
    setRescheduling(true);
    try {
      await api.post(`/appointments/${rescheduleApt.id}/reschedule`, {
        date: newDate,
        time: newTime,
      });
      toast.success("Rendez-vous reprogrammé avec succès !");
      setRescheduleApt(null);
      fetchCarnetData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors de la reprogrammation");
    } finally {
      setRescheduling(false);
    }
  };

  // Règle demandée :
  // Si la personne a été vue/consultée par le médecin (status === 'completed'), la Programmation disparaît !
  // Sinon, possibilité de reprogrammer pour être consulté dans la période disponible.
  const activeProgrammations = appointments.filter(apt => 
    apt.status !== 'completed' && apt.status !== 'cancelled'
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="text-slate-500 font-medium">Récupération de votre historique médical...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-3xl p-8 shadow-lg flex items-center gap-4">
        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
          <BookOpen size={40} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black mb-2">Mon Carnet Médical</h1>
          <p className="text-blue-100">Retrouvez l'historique complet de vos consultations et vos programmations en attente.</p>
        </div>
      </header>

      {/* Profil Médical Rapide (Groupe sanguin, Allergies, Antécédents Familiaux) */}
      {(() => {
        const stored = localStorage.getItem('patient');
        const p = stored ? JSON.parse(stored) : {};
        return (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Groupe Sanguin</p>
              <p className="text-lg font-black text-red-700">{p.bloodGroup || 'Non renseigné'}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Allergies Connues</p>
              <p className="text-sm font-bold text-amber-900">{p.allergies || 'Aucune allergie signalée'}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Antécédents Familiaux</p>
              <p className="text-sm font-bold text-indigo-900">{p.familyHistory || 'Aucun antécédent familial'}</p>
            </div>
          </div>
        );
      })()}

      {/* SECTION PROGRAMMATION(S) DE CONSULTATION */}
      {/* Condition : Si la personne a été consultée par le médecin (status === 'completed'), la programmation disparaît ! Sinon possibilité de reprogrammer */}
      {activeProgrammations.length > 0 && (
        <section className="bg-white rounded-3xl p-6 border-2 border-amber-200/90 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Clock className="text-amber-500" size={24} /> 
                Programmation(s) en attente de consultation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Une fois la consultation réalisée par le médecin, la programmation disparaît et s'enregistre dans votre carnet.
              </p>
            </div>
            <span className="text-xs font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full w-fit">
              {activeProgrammations.length} active{activeProgrammations.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid gap-3">
            {activeProgrammations.map(apt => {
              const isMissed = apt.status === 'missed' || (apt.status === 'scheduled' && new Date(apt.date) < new Date());
              const isPaid = apt.paymentStatus === 'completed' || apt.paymentStatus === 'paid' || apt.paymentStatus === 'payé';

              return (
                <div 
                  key={apt.id} 
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isMissed ? 'bg-rose-50/60 border-rose-200' : 'bg-amber-50/30 border-amber-100 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${isMissed ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      <Calendar size={22} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-extrabold text-slate-900 text-base">
                          {new Date(apt.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <span className="text-xs font-black text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          {new Date(apt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        Médecin traitant : <span className="font-bold text-slate-800">Dr. {apt.doctor?.name}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isPaid 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : apt.paymentStatus === 'pending_confirmation'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {apt.paymentStatus === 'pending_confirmation' 
                        ? 'En attente caisse' 
                        : isPaid 
                        ? 'Payé' 
                        : 'Paiement en attente'}
                    </span>

                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      isMissed ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isMissed ? 'Non présenté / Expiré' : 'Programmé'}
                    </span>

                    {/* Règle des 7 jours */}
                    {apt.isPast7Days ? (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
                        Délai 7j expiré (Nouveau paiement requis)
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleApt(apt);
                            setNewDate('');
                            setNewTime('');
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-200 active:scale-95 transition-all"
                          title="Reprogrammer pour être consulté dans la période disponible (délai 7 jours)"
                        >
                          <RefreshCw size={14} /> Reprogrammer
                        </button>
                        {apt.daysRemaining !== undefined && apt.daysRemaining < 7 && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            {apt.daysRemaining}j restants
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* HISTORIQUE DES CONSULTATIONS DU CARNET */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <Stethoscope className="text-blue-600" size={26} />
          Historique des Consultations Réalisées
        </h2>

        {consultations.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="text-slate-300" size={40} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Carnet vide</h2>
            <p className="text-slate-500">Vous n'avez pas encore de consultations enregistrées à l'hôpital.</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:via-blue-400 before:to-transparent">
            {consultations.map((consult) => (
              <div key={consult.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                {/* Timeline Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-500 text-white shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <Stethoscope size={16} />
                </div>

                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 p-6">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                    <Calendar size={16} />
                    <span className="font-semibold text-slate-700">
                      {new Date(consult.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserRound size={16} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Médecin</p>
                      <p className="font-medium text-slate-800">Dr. {consult.doctor?.name || 'Non spécifié'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {consult.symptoms && (
                      <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100/50">
                        <p className="text-xs font-bold text-orange-600 uppercase mb-1">Renseignement Clinique (Motif de la consultation)</p>
                        <p className="text-slate-700">{consult.symptoms}</p>
                      </div>
                    )}

                    {consult.diagnosis && (
                      <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-1 flex items-center gap-1">
                          <FileText size={14} /> Diagnostic
                        </p>
                        <p className="text-slate-700">{consult.diagnosis}</p>
                      </div>
                    )}

                    {consult.treatment && (
                      <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                        <p className="text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1">
                          <Pill size={14} /> Traitements Médicales (Prescription)
                        </p>
                        <p className="text-slate-700">{consult.treatment}</p>
                      </div>
                    )}
                    
                    {consult.sickLeave && (
                      <div className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-lg">
                        Arrêt de travail prescrit
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL REPROGRAMMATION */}
      {rescheduleApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-[2rem] sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
              <RefreshCw className="text-amber-500" /> Reprogrammer votre consultation
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Choisissez une nouvelle date et un créneau horaire avec Dr. {rescheduleApt.doctor?.name} pour être consulté dans la période disponible.
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Nouvelle date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                  required
                />
              </div>

              {newDate && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <span>Créneaux horaires</span>
                      {loadingSlots && <span className="text-xs text-amber-600 font-bold animate-pulse">Recherche...</span>}
                    </label>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <span className="flex items-center gap-1 text-amber-600">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Libre
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span> Grisé (Occupé / Passé)
                      </span>
                    </div>
                  </div>

                  {!loadingSlots && availableSlots.length === 0 ? (
                    <p className="text-xs text-orange-600 font-bold p-3 bg-orange-50 rounded-xl">
                      Aucun créneau libre à cette date pour ce médecin.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map(slot => {
                        const isReserved = Boolean(slot.isReserved);
                        const isPast = Boolean(slot.isPast);
                        const isSelected = newTime === slot.time;

                        if (isReserved) {
                          return (
                            <div
                              key={slot.time}
                              className="p-2.5 rounded-xl font-bold text-xs border border-slate-200 bg-slate-100 text-slate-400 flex flex-col items-center justify-center cursor-not-allowed opacity-60 select-none"
                              title="Créneau déjà réservé par un patient"
                            >
                              <span className="line-through">{slot.time}</span>
                              <span className="text-[9px] text-rose-500 font-extrabold uppercase">Réservé</span>
                            </div>
                          );
                        }

                        if (isPast) {
                          return (
                            <div
                              key={slot.time}
                              className="p-2.5 rounded-xl font-bold text-xs border border-slate-100 bg-slate-100/60 text-slate-300 flex flex-col items-center justify-center cursor-not-allowed opacity-40 select-none"
                              title="Heure déjà passée aujourd'hui"
                            >
                              <span className="line-through">{slot.time}</span>
                              <span className="text-[9px] text-slate-400 uppercase">Passé</span>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setNewTime(slot.time)}
                            className={`p-2.5 rounded-xl font-bold text-xs border transition-all flex flex-col items-center justify-center ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200 scale-105'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50'
                            }`}
                          >
                            <span>{slot.time}</span>
                            <span className={`text-[9px] font-bold ${isSelected ? 'text-amber-100' : 'text-emerald-600'}`}>
                              Libre
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleApt(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={rescheduling || !newDate || !newTime}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-amber-200"
                >
                  {rescheduling ? 'Reprogrammation...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
