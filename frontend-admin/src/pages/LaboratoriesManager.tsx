import { useEffect, useState } from 'react';
import { Plus, Trash2, Microscope, X, Search, Loader2 } from 'lucide-react';
import api from '../services/api';

interface Laboratory {
  id: string;
  name: string;
  hospital?: { name: string };
}

export default function LaboratoriesManager() {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', hospitalId: '' });
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hospitals, setHospitals] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [laboratoriesRes, hospitalsRes] = await Promise.all([
        api.get('/laboratories'),
        api.get('/hospitals')
      ]);
      setLaboratories(laboratoriesRes.data);
      setHospitals(hospitalsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/laboratories', { ...formData, hospitalId: formData.hospitalId || undefined });
      fetchData();
      setShowModal(false);
      setFormData({ name: '', hospitalId: '' });
    } catch (error) {
      alert('Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLaboratory = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce laboratoire ?')) return;
    try {
      await api.delete(`/laboratories/${id}`);
      fetchData();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const filtered = laboratories.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Microscope className="text-purple-600" size={28} />
            Gestion des Laboratoires
          </h2>
          <p className="text-slate-500 mt-1">Créez et gérez les laboratoires indépendants.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 transition-colors shadow-sm shadow-purple-500/30 font-medium"
        >
          <Plus size={20} /> Nouveau Laboratoire
        </button>
      </div>

      <div className="bento-card p-0 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-sm font-medium transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold text-left">
              <tr>
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Hôpital (Optionnel)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto mb-2 text-purple-600" size={24} />
                    Chargement...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                    Aucun laboratoire trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600">{p.hospital?.name || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteLaboratory(p.id)} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Nouveau Laboratoire</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nom du laboratoire</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Hôpital (Optionnel)</label>
                  <select 
                    value={formData.hospitalId}
                    onChange={e => setFormData({...formData, hospitalId: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="">-- Indépendant --</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 font-bold">Annuler</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold flex justify-center items-center">
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
