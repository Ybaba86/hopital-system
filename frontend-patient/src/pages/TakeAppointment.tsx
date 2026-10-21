import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

interface Hospital {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  name: string;
  service?: { name: string };
}

interface SlotItem {
  time: string;
  isReserved?: boolean;
  isPast?: boolean;
  isAvailable?: boolean;
}

export default function TakeAppointment() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  
  // NOUVEAU: Programmation VIP / Personnalisée
  const [isVip, setIsVip] = useState(false);
  const [locationType, setLocationType] = useState<'hospital' | 'home'>('hospital');
  const [homeAddress, setHomeAddress] = useState('');

  // NOUVEAU: Choix du mode de paiement
  const [paymentMethod, setPaymentMethod] = useState<'on_site' | 'online'>('on_site');
  const [onlineOperator, setOnlineOperator] = useState<'wave' | 'orange_money' | 'card'>('wave');

  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [hospitalError, setHospitalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const patient = JSON.parse(localStorage.getItem('patient') || '{}');

  // Charger les hôpitaux
  useEffect(() => {
    const fetchHospitals = async () => {
      setLoadingHospitals(true);
      setHospitalError('');
      try {
        const res = await api.get('/hospitals');
        setHospitals(res.data);
      } catch (error: any) {
        setHospitalError("Impossible de charger les hôpitaux. Vérifiez le backend.");
      } finally {
        setLoadingHospitals(false);
      }
    };
    fetchHospitals();
  }, []);

  // Charger les médecins quand un hôpital est sélectionné
  useEffect(() => {
    if (!selectedHospital) {
      setDoctors([]);
      return;
    }

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await api.get(`/doctors?hospitalId=${selectedHospital}`);
        setDoctors(res.data);
      } catch (error: any) {
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [selectedHospital]);

  // Charger les créneaux disponibles
  useEffect(() => {
    if (!selectedDoctor || !date) {
      setAvailableSlots([]);
      setTime('');
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setTime('');
      try {
        const res = await api.get(`/appointments/available-slots?doctorId=${selectedDoctor}&date=${date}`);
        const data = Array.isArray(res.data) ? res.data : [];
        const normalized = data.map((item: any) => {
          if (typeof item === 'string') {
            return { time: item, isReserved: false, isPast: false, isAvailable: true };
          }
          return item;
        });
        setAvailableSlots(normalized);
      } catch (error) {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctor, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital || !selectedDoctor || !date || !time) {
      toast.error("Veuillez sélectionner un hôpital, un médecin, une date et une heure.");
      return;
    }

    if (isVip && locationType === 'home' && !homeAddress.trim()) {
      toast.error("Veuillez renseigner votre adresse de domicile pour la consultation.");
      return;
    }

    if (!patient.id) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        patientId: patient.id,
        hospitalId: selectedHospital,
        doctorId: selectedDoctor,
        date: `${date}T${time}:00`,
        isEmergency: isUrgent,
        isVip,
        locationType: isVip ? locationType : 'hospital',
        homeAddress: isVip && locationType === 'home' ? homeAddress : null,
        paymentMethod,
      };

      const res = await api.post('/appointments', payload);
      const createdApt = res.data;

      // Si paiement en ligne choisi, effectuer le règlement immédiatement
      if (paymentMethod === 'online') {
        try {
          await api.post('/appointments/pay-online', {
            appointmentId: createdApt.id,
            paymentType: onlineOperator,
            amount: isVip ? 15000 : 5000,
          });
          toast.success("Rendez-vous programmé et payé en ligne avec succès !");
        } catch (payErr) {
          toast.success("Rendez-vous créé ! Le paiement en ligne peut être finalisé dans 'Mes rendez-vous'.");
        }
      } else {
        toast.success("Rendez-vous programmé ! Vous pourrez régler sur place à la caisse.");
      }

      setTimeout(() => {
        navigate('/rendez-vous');
      }, 1500);
    } catch (error: any) {
      console.error("Erreur création RDV:", error);
      toast.error(error.response?.data?.error || "Erreur lors de la demande de rendez-vous");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-extrabold mb-8 flex items-center gap-3 text-slate-900">
        <Calendar className="text-blue-600" size={32} />
        Prendre rendez-vous
      </h2>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100">
        {hospitalError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 font-semibold">
            {hospitalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* HÔPITAL */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Hôpital de votre choix</label>
            <select
              value={selectedHospital}
              onChange={(e) => {
                setSelectedHospital(e.target.value);
                setSelectedDoctor('');
              }}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all"
              required
              disabled={loadingHospitals}
            >
              <option value="">
                {loadingHospitals ? "Chargement des hôpitaux..." : "-- Sélectionner un hôpital --"}
              </option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* MÉDECIN */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Médecin</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all"
              required
              disabled={!selectedHospital || loadingDoctors}
            >
              <option value="">
                {loadingDoctors 
                  ? "Chargement des médecins..." 
                  : "-- Sélectionner un médecin --"}
              </option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name} {d.service ? `(${d.service.name})` : ''}
                </option>
              ))}
            </select>
            {!selectedHospital && (
              <p className="text-xs text-slate-400 mt-1 font-medium">Sélectionnez d’abord un hôpital</p>
            )}
          </div>

          {/* DATE & HEURE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Date du rendez-vous</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Heure sélectionnée</label>
              <input
                type="text"
                readOnly
                placeholder="Choisissez un créneau ci-dessous"
                value={time ? `${time}` : ''}
                className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-blue-600 outline-none cursor-default"
                required
              />
            </div>
          </div>

          {/* HEURE (CRENEAUX DISPONIBLES) */}
          {date && selectedDoctor && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span>Créneaux horaires</span>
                  {loadingSlots && <span className="text-xs text-blue-500 font-bold animate-pulse">Recherche des créneaux...</span>}
                </label>
                
                {/* Légende visuelle */}
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Disponible
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Réservé (Grisé)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Passé (Grisé)
                  </span>
                </div>
              </div>
              
              {!loadingSlots && availableSlots.length === 0 ? (
                <div className="p-4 bg-orange-50 text-orange-700 rounded-2xl text-sm font-bold border border-orange-100">
                  Aucun créneau disponible pour ce médecin à cette date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableSlots.map(slot => {
                    const isReserved = Boolean(slot.isReserved);
                    const isPast = Boolean(slot.isPast);
                    const isSelected = time === slot.time;

                    if (isReserved) {
                      return (
                        <div
                          key={slot.time}
                          className="py-2.5 px-1 rounded-xl font-bold border border-slate-200 bg-slate-100 text-slate-400 text-xs flex flex-col items-center justify-center cursor-not-allowed opacity-60 select-none"
                          title="Créneau déjà réservé par un patient"
                        >
                          <span className="line-through">{slot.time}</span>
                          <span className="text-[10px] text-rose-500 font-extrabold uppercase mt-0.5">Réservé</span>
                        </div>
                      );
                    }

                    if (isPast) {
                      return (
                        <div
                          key={slot.time}
                          className="py-2.5 px-1 rounded-xl font-bold border border-slate-100 bg-slate-100/60 text-slate-300 text-xs flex flex-col items-center justify-center cursor-not-allowed opacity-40 select-none"
                          title="Cette heure est déjà dépassée"
                        >
                          <span className="line-through">{slot.time}</span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Passé</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setTime(slot.time)}
                        className={`py-3 px-2 rounded-xl font-bold transition-all border text-sm flex flex-col items-center justify-center ${
                          isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-300 ring-2 ring-blue-400/50 scale-[1.02]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50 active:scale-95'
                        }`}
                      >
                        <span>{slot.time}</span>
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-emerald-600'}`}>
                          Libre
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION VIP & PROGRAMMATION PERSONNALISÉE */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVip}
                  onChange={(e) => setIsVip(e.target.checked)}
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                />
                <span className="font-extrabold text-amber-900 text-base flex items-center gap-2">
                  👑 Programmation Personnalisée (Patient VIP)
                </span>
              </label>
              <span className="text-xs font-bold bg-amber-200/80 text-amber-800 px-3 py-1 rounded-full uppercase tracking-wider">
                Option VIP
              </span>
            </div>

            {isVip && (
              <div className="pt-3 border-t border-amber-200 space-y-4 animate-in fade-in">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Lieu de consultation souhaité :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLocationType('hospital')}
                    className={`p-3 rounded-xl font-bold border text-sm flex items-center justify-center gap-2 transition-all ${
                      locationType === 'hospital'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                        : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/50'
                    }`}
                  >
                    🏥 À l’Hôpital de son choix
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType('home')}
                    className={`p-3 rounded-xl font-bold border text-sm flex items-center justify-center gap-2 transition-all ${
                      locationType === 'home'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                        : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/50'
                    }`}
                  >
                    🏠 Au Domicile du patient
                  </button>
                </div>

                {locationType === 'home' && (
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Adresse complète de domicile pour la visite médicale :
                    </label>
                    <textarea
                      rows={2}
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      placeholder="Ex: Villa n° 42, Almadies, en face de la pharmacie, Dakar. Code portail: 1234..."
                      className="w-full p-3 bg-white border border-amber-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium text-slate-800"
                      required={locationType === 'home'}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CHOIX DU MODE DE PAIEMENT : SUR PLACE OU EN LIGNE */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider">
              Mode de paiement :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setPaymentMethod('on_site')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-1 ${
                  paymentMethod === 'on_site'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-base">
                  <span>Payer sur place</span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'on_site'}
                    onChange={() => setPaymentMethod('on_site')}
                    className="accent-blue-600"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Règlement au guichet / caisse de l'hôpital lors de votre arrivée.
                </p>
              </div>

              <div
                onClick={() => setPaymentMethod('online')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-1 ${
                  paymentMethod === 'online'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-base">
                  <span>Payer en ligne</span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="accent-blue-600"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Paiement sécurisé immédiat via Wave, Orange Money ou Carte Bancaire.
                </p>
              </div>
            </div>

            {paymentMethod === 'online' && (
              <div className="pt-4 border-t border-slate-200 space-y-3 animate-in fade-in">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Sélectionnez votre moyen de paiement en ligne :
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlineOperator('wave')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs border transition-all ${
                      onlineOperator === 'wave'
                        ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200'
                        : 'bg-white text-sky-700 border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    🌊 WAVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineOperator('orange_money')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs border transition-all ${
                      onlineOperator === 'orange_money'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                        : 'bg-white text-orange-700 border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    🍊 ORANGE MONEY
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineOperator('card')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs border transition-all ${
                      onlineOperator === 'card'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    💳 CARTE
                  </button>
                </div>
                <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-xs font-bold flex justify-between items-center">
                  <span>Montant de la consultation :</span>
                  <span className="text-sm font-black">{isVip ? '15 000 FCFA (Tarif VIP)' : '5 000 FCFA'}</span>
                </div>
              </div>
            )}
          </div>

          {/* RENDEZ-VOUS URGENT */}
          <div className="flex items-start gap-3 bg-red-50 p-4 rounded-2xl border border-red-100">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="mt-1 w-5 h-5 accent-red-600 rounded cursor-pointer"
            />
            <div>
              <p className="font-semibold text-red-700">Rendez-vous urgent</p>
              <p className="text-sm text-red-600">
                Priorité maximale • L’équipe médicale sera notifiée en priorité
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !time}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold py-4 rounded-2xl transition-all text-lg shadow-lg shadow-blue-500/20 active:scale-98"
          >
            {submitting ? "Confirmation en cours..." : "Confirmer le rendez-vous"}
          </button>
        </form>
      </div>
    </div>
  );
}