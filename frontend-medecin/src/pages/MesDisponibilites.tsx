import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, CalendarDays, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

export default function MesDisponibilites() {
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const doctorStr = localStorage.getItem('medecin');
  const doctorId = doctorStr ? JSON.parse(doctorStr).id : null;

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      toast.error("Impossible de trouver l'ID du médecin.");
      return;
    }
    const fetchAvailabilities = async () => {
      try {
        const res = await api.get(`/doctors/${doctorId}/availabilities`);
        setAvailabilities(res.data);
      } catch (error) {
        toast.error("Erreur lors de la récupération des disponibilités");
      } finally {
        setLoading(false);
      }
    };
    fetchAvailabilities();
  }, [doctorId]);

  const addAvailability = () => {
    setAvailabilities([...availabilities, { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }]);
  };

  const removeAvailability = (index: number) => {
    const newArr = [...availabilities];
    newArr.splice(index, 1);
    setAvailabilities(newArr);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newArr = [...availabilities];
    newArr[index][field] = field === 'dayOfWeek' ? parseInt(value) : value;
    setAvailabilities(newArr);
  };

  const handleSave = async () => {
    if (!doctorId) return;
    setSaving(true);
    try {
      await api.post(`/doctors/${doctorId}/availabilities`, { availabilities });
      toast.success("Vos disponibilités ont été enregistrées avec succès !");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement des disponibilités");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-6 space-y-6 animate-in fade-in duration-500 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="text-blue-600" size={28} />
            Mes Disponibilités
          </h2>
          <p className="text-slate-500 mt-1">Configurez vos jours et heures de travail pour la prise de rendez-vous.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl hover:bg-blue-700 transition-all font-bold text-sm shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 disabled:opacity-70 flex items-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays size={20} className="text-slate-400" />
            Horaires de travail
          </h3>
          <button
            onClick={addAvailability}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} /> Ajouter une plage horaire
          </button>
        </div>

        {availabilities.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Clock size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Vous n'avez défini aucune disponibilité.</p>
            <p className="text-slate-400 text-sm mt-1">Les patients ne pourront pas prendre rendez-vous.</p>
            <button
              onClick={addAvailability}
              className="mt-4 px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
            >
              Définir mes horaires
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {availabilities.map((av, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jour</label>
                  <select
                    value={av.dayOfWeek}
                    onChange={(e) => handleChange(idx, 'dayOfWeek', e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Début</label>
                  <input
                    type="time"
                    value={av.startTime}
                    onChange={(e) => handleChange(idx, 'startTime', e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fin</label>
                  <input
                    type="time"
                    value={av.endTime}
                    onChange={(e) => handleChange(idx, 'endTime', e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>

                <button
                  onClick={() => removeAvailability(idx)}
                  className="sm:mt-5 p-2.5 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors sm:opacity-0 group-hover:opacity-100"
                  title="Supprimer cette plage"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
