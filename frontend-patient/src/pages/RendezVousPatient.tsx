import { useEffect, useState } from 'react';
import { Calendar, Clock, User, AlertCircle, Plus, Download, RefreshCw, CreditCard, Home, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import toast from 'react-hot-toast';
import api from '../services/api';

interface Appointment {
  id: string;
  date: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  isVip?: boolean;
  locationType?: string;
  homeAddress?: string;
  doctorId?: string;
  doctor: { id?: string; name: string };
  isRescheduled?: boolean;
  diffDays?: number;
  isPast7Days?: boolean;
  daysRemaining?: number;
  canReschedule?: boolean;
  queueTicket?: {
    id: string;
    ticketNumber: number;
    status: string;
  } | null;
  latestPayment?: {
    id: string;
    amount: number;
    paymentType: string;
    status: string;
  } | null;
}

interface SlotItem {
  time: string;
  isReserved?: boolean;
  isPast?: boolean;
  isAvailable?: boolean;
}

export default function RendezVousPatient() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Reprogrammation
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  // Modal Paiement en ligne
  const [payApt, setPayApt] = useState<Appointment | null>(null);
  const [onlineOperator, setOnlineOperator] = useState<'wave' | 'orange_money' | 'card'>('wave');
  const [processingPay, setProcessingPay] = useState(false);

  // Charger les rendez-vous
  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/my');
      setAppointments(res.data);
    } catch (error) {
      console.error("Erreur chargement rendez-vous:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
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
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors de la reprogrammation");
    } finally {
      setRescheduling(false);
    }
  };

  const handleOnlinePaymentSubmit = async () => {
    if (!payApt) return;
    setProcessingPay(true);
    try {
      await api.post('/appointments/pay-online', {
        appointmentId: payApt.id,
        paymentType: onlineOperator,
        amount: payApt.isVip ? 15000 : 5000,
      });
      toast.success("Paiement en ligne soumis ! En attente de validation par la caisse.", { duration: 4500 });
      setPayApt(null);
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors du paiement");
    } finally {
      setProcessingPay(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseStyles = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider";
    switch (status.toLowerCase()) {
      case 'completed':
      case 'terminé':
      case 'consulté':
      case 'effectué':
        return `${baseStyles} bg-emerald-100 text-emerald-800 border border-emerald-300`;
      case 'confirmé':
      case 'confirmed':
        return `${baseStyles} bg-emerald-100 text-emerald-700`;
      case 'en attente':
      case 'scheduled':
        return `${baseStyles} bg-blue-100 text-blue-700`;
      case 'missed':
      case 'non présenté':
      case 'non présenté / expiré':
        return `${baseStyles} bg-rose-100 text-rose-700 border border-rose-200`;
      case 'annulé':
      case 'cancelled':
        return `${baseStyles} bg-red-100 text-red-700`;
      default:
        return `${baseStyles} bg-slate-100 text-slate-600`;
    }
  };

  const getPaymentBadge = (status: string) => {
    const baseStyles = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border";
    if (status === 'completed' || status === 'paid' || status === 'payé') {
      return `${baseStyles} bg-emerald-100 text-emerald-800 border-emerald-300`;
    }
    if (status === 'pending_confirmation') {
      return `${baseStyles} bg-amber-100 text-amber-800 border-amber-300`;
    }
    return `${baseStyles} bg-slate-100 text-slate-700 border-slate-300`;
  };

  const generateReceipt = (apt: Appointment) => {
    try {
      const doc = new jsPDF();
      const patient = JSON.parse(localStorage.getItem('patient') || '{}');

      // En-tête
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.text("MediFlow - Hôpital", 105, 20, { align: "center" });

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("REÇU DE CONSULTATION", 105, 30, { align: "center" });

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, 190, 35);

      doc.setFontSize(12);
      doc.text(`Patient : ${patient.firstName || ''} ${patient.lastName || ''}`, 20, 50);
      doc.text(`Médecin : Dr. ${apt.doctor?.name || 'Inconnu'}`, 20, 60);
      
      const aptDate = new Date(apt.date);
      doc.text(`Date : ${aptDate.toLocaleDateString('fr-FR')}`, 20, 70);
      doc.text(`Heure : ${aptDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 20, 80);
      
      if (apt.isVip) {
        doc.text(`Option : VIP - ${apt.locationType === 'home' ? 'Visite à Domicile' : 'À l\'Hôpital'}`, 20, 90);
        if (apt.homeAddress) doc.text(`Adresse : ${apt.homeAddress}`, 20, 100);
      }
      doc.text(`Statut du paiement : Payé (${apt.paymentMethod === 'online' ? 'En ligne' : 'Sur place'})`, 20, apt.isVip ? 110 : 90);
      doc.text(`ID Rendez-vous : ${apt.id}`, 20, apt.isVip ? 120 : 100);

      const canvas = document.createElement("canvas");
      const shortId = apt.id.substring(0, 12).toUpperCase();
      JsBarcode(canvas, shortId, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        margin: 10
      });

      const barcodeDataUrl = canvas.toDataURL("image/png");
      doc.addImage(barcodeDataUrl, 'PNG', 55, apt.isVip ? 135 : 120, 100, 40);

      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Ce reçu est généré électroniquement et tient lieu de justificatif de paiement.", 105, 280, { align: "center" });

      doc.save(`Reçu_Consultation_${aptDate.toISOString().split('T')[0]}.pdf`);
      toast.success('Reçu généré avec succès !');
    } catch (error) {
      console.error("Erreur PDF:", error);
      toast.error('Erreur lors de la génération du reçu');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Calendar className="text-blue-600" size={32} />
            Mes rendez-vous
          </h2>
          <p className="text-slate-500 mt-2">Consultez l'historique, réglez en ligne ou reprogrammez vos consultations.</p>
        </div>
        <Link 
          to="/take-appointment" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Nouveau rendez-vous
        </Link>
      </header>

      {appointments.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
          <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 text-lg">Aucun rendez-vous trouvé.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map(apt => {
            const isMissed = apt.status === 'missed' || (apt.status === 'scheduled' && new Date(apt.date) < new Date());
            const isPaid = apt.paymentStatus === 'completed' || apt.paymentStatus === 'paid' || apt.paymentStatus === 'payé';

            return (
              <div key={apt.id} className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-5">
                  <div className={`p-4 rounded-2xl transition-colors ${
                    isMissed 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    <Clock size={28} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-xl font-black text-slate-900">
                        {new Date(apt.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </h4>
                      {apt.isVip && (
                        <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Crown size={12} /> Patient VIP
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-sm">
                      <span className="flex items-center gap-1 font-bold text-slate-700">
                        <Clock size={14}/> {new Date(apt.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14}/> Dr. {apt.doctor?.name}
                      </span>
                      {apt.isVip && apt.locationType === 'home' && (
                        <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                          <Home size={14}/> Visite à Domicile {apt.homeAddress ? `(${apt.homeAddress})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
                  <div className="flex gap-2 flex-wrap items-center">
                    {/* Bouton Reçu si payé */}
                    {isPaid && (
                      <button
                        onClick={() => generateReceipt(apt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-bold transition-colors"
                        title="Télécharger le reçu"
                      >
                        <Download size={16} /> Reçu
                      </button>
                    )}

                    {/* Ticket de file d'attente officiel si payé et généré */}
                    {isPaid && apt.queueTicket && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black shadow-sm" title="Votre numéro de passage chez le médecin">
                        🎟️ Ticket #{apt.queueTicket.ticketNumber}
                      </span>
                    )}

                    {/* État de paiement : En attente de validation caisse ou Bouton Payer en ligne */}
                    {apt.paymentStatus === 'pending_confirmation' ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold animate-pulse" title="Paiement en ligne soumis, en attente de vérification par la caisse">
                        ⏳ Validation caisse en cours...
                      </span>
                    ) : (
                      !isPaid && apt.status !== 'cancelled' && (
                        <button
                          onClick={() => setPayApt(apt)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200 transition-all active:scale-95"
                        >
                          <CreditCard size={15} /> Payer en ligne
                        </button>
                      )
                    )}

                    {/* Règle des 7 jours : Si la consultation n'est pas arrivée à 7 jours, reprogrammation possible. Sinon (> 7 jours), nouveau paiement requis */}
                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                      apt.isPast7Days ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
                            Délai 7j expiré
                          </span>
                          <button
                            onClick={() => setPayApt(apt)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition-all active:scale-95"
                            title="Le délai de 7 jours est dépassé. Veuillez effectuer un nouveau paiement pour réactiver la consultation."
                          >
                            <CreditCard size={14} /> Nouveau paiement
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setRescheduleApt(apt);
                              setNewDate('');
                              setNewTime('');
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 ${
                              isMissed 
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200' 
                                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                            }`}
                            title={`Reprogrammer gratuitement (reste ${apt.daysRemaining ?? 7} jour(s) sur les 7 jours autorisés)`}
                          >
                            <RefreshCw size={15} /> Reprogrammer
                          </button>
                          {apt.daysRemaining !== undefined && apt.daysRemaining < 7 && (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              {apt.daysRemaining}j restants
                            </span>
                          )}
                        </div>
                      )
                    )}

                    <span className={getPaymentBadge(apt.paymentStatus)}>
                      {apt.paymentStatus === 'pending_confirmation'
                        ? 'En attente caisse'
                        : isPaid
                        ? 'Payé'
                        : 'Paiement en attente'}
                    </span>

                    <span className={getStatusBadge(isMissed ? 'Non présenté / Expiré' : apt.status)}>
                      {isMissed ? 'Non présenté / Expiré' : apt.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL REPROGRAMMATION */}
      {rescheduleApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-[2rem] sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
              <RefreshCw className="text-amber-500" /> Reprogrammer le rendez-vous
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Choisissez une nouvelle date et heure avec Dr. {rescheduleApt.doctor?.name} parmi les créneaux disponibles.
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
                              title="Créneau déjà réservé"
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
                              title="Heure passée"
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

      {/* MODAL PAIEMENT EN LIGNE */}
      {payApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-[2rem] sm:rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
              <CreditCard className="text-emerald-500" /> Paiement en ligne
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Réglez votre consultation avec Dr. {payApt.doctor?.name} en toute sécurité.
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm">Montant :</span>
                <span className="text-2xl font-black text-emerald-700">
                  {payApt.isVip ? '15 000 FCFA' : '5 000 FCFA'}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Sélectionnez le moyen de paiement :
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlineOperator('wave')}
                    className={`py-3 rounded-xl font-black text-xs border transition-all ${
                      onlineOperator === 'wave'
                        ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200'
                        : 'bg-white text-sky-700 border-slate-200'
                    }`}
                  >
                    🌊 WAVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineOperator('orange_money')}
                    className={`py-3 rounded-xl font-black text-xs border transition-all ${
                      onlineOperator === 'orange_money'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                        : 'bg-white text-orange-700 border-slate-200'
                    }`}
                  >
                    🍊 OM
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineOperator('card')}
                    className={`py-3 rounded-xl font-black text-xs border transition-all ${
                      onlineOperator === 'card'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    💳 CARTE
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  ℹ️ <strong>Processus :</strong> Dès que vous validez, la caisse de l'hôpital confirme la réception de votre paiement. Votre ticket d'attente officiel et votre reçu seront instantanément activés.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayApt(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleOnlinePaymentSubmit}
                  disabled={processingPay}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5"
                >
                  {processingPay ? 'Traitement...' : 'Valider le paiement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}