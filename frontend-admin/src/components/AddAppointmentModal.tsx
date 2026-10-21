import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddAppointmentModal({ isOpen, onClose, onSuccess }: AddAppointmentModalProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  
  const [isUrgent, setIsUrgent] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load initial data
      Promise.all([
        api.get('/patients'),
        api.get('/hospitals')
      ]).then(([resPat, resHosp]) => {
        setPatients(resPat.data);
        setHospitals(resHosp.data);
      }).catch(err => console.error("Erreur chargement données de base", err));
    } else {
      // Reset state
      setSelectedPatient('');
      setSelectedHospital('');
      setSelectedDoctor('');
      setDate('');
      setTime('');
      setAvailableSlots([]);
      setIsUrgent(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!selectedHospital) {
      setDoctors([]);
      return;
    }
    api.get(`/doctors?hospitalId=${selectedHospital}`)
      .then(res => setDoctors(res.data))
      .catch(err => console.error("Erreur chargement médecins", err));
  }, [selectedHospital]);

  useEffect(() => {
    if (!selectedDoctor || !date) {
      setAvailableSlots([]);
      setTime('');
      return;
    }
    setLoadingSlots(true);
    setTime('');
    api.get(`/appointments/available-slots?doctorId=${selectedDoctor}&date=${date}`)
      .then(res => setAvailableSlots(res.data))
      .catch(err => console.error("Erreur slots", err))
      .finally(() => setLoadingSlots(false));
  }, [selectedDoctor, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedHospital || !selectedDoctor || !date || !time) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/appointments', {
        patientId: selectedPatient,
        hospitalId: selectedHospital,
        doctorId: selectedDoctor,
        date: `${date}T${time}:00`,
        isEmergency: isUrgent,
      });
      toast.success("Rendez-vous ajouté avec succès !");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Ajouter un rendez-vous</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Patient</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            >
              <option value="">Sélectionner un patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Hôpital</label>
              <select
                value={selectedHospital}
                onChange={(e) => { setSelectedHospital(e.target.value); setSelectedDoctor(''); }}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              >
                <option value="">Sélectionner un hôpital</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Médecin</label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
                disabled={!selectedHospital}
              >
                <option value="">Sélectionner un médecin</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Date du rendez-vous</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>

          {date && selectedDoctor && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                <span>Créneaux horaires</span>
                {loadingSlots && <span className="text-blue-500 text-xs">Recherche...</span>}
              </label>
              {!loadingSlots && availableSlots.length === 0 ? (
                <div className="p-4 bg-orange-50 text-orange-700 rounded-2xl text-sm font-bold">
                  Aucun créneau disponible.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {availableSlots.map((slotItem: any) => {
                    const slotTime = typeof slotItem === 'string' ? slotItem : slotItem.time;
                    const isReserved = typeof slotItem === 'object' && Boolean(slotItem.isReserved);
                    const isPast = typeof slotItem === 'object' && Boolean(slotItem.isPast);

                    if (isReserved) {
                      return (
                        <div
                          key={slotTime}
                          className="py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-100 text-slate-400 flex flex-col items-center justify-center cursor-not-allowed opacity-60 select-none"
                          title="Créneau réservé"
                        >
                          <span className="line-through">{slotTime}</span>
                          <span className="text-[9px] text-rose-500 uppercase">Réservé</span>
                        </div>
                      );
                    }

                    if (isPast) {
                      return (
                        <div
                          key={slotTime}
                          className="py-2 rounded-xl text-xs font-bold border border-slate-100 bg-slate-100/60 text-slate-300 flex flex-col items-center justify-center cursor-not-allowed opacity-40 select-none"
                          title="Heure passée"
                        >
                          <span className="line-through">{slotTime}</span>
                          <span className="text-[9px] text-slate-400 uppercase">Passé</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slotTime}
                        type="button"
                        onClick={() => setTime(slotTime)}
                        className={`py-2 rounded-xl text-sm font-bold transition-all border ${
                          time === slotTime
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {slotTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
            <input
              type="checkbox"
              id="urgent"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
            />
            <label htmlFor="urgent" className="font-bold text-rose-700 cursor-pointer select-none">
              Marquer comme urgence
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !time}
              className="px-6 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-2xl transition-all shadow-lg shadow-blue-600/20"
            >
              {submitting ? 'Ajout...' : 'Ajouter le rendez-vous'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
