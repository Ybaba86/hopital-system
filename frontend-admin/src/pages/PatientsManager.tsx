import { useState, useEffect } from 'react';
import { Users, Search, Edit2, Trash2, X, Lock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function PatientsManager() {
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal d'édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  // Champs du formulaire (y compris mot de passe optionnel)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    bloodGroup: '',
    familyHistory: '',
    password: ''
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
      setFilteredPatients(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = patients.filter(p => 
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.uniqueNumber.toLowerCase().includes(term) ||
      (p.phone && p.phone.includes(term))
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const handleEditClick = (patient: any) => {
    setSelectedPatient(patient);
    setFormData({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      phone: patient.phone || '',
      email: patient.email || '',
      bloodGroup: patient.bloodGroup || '',
      familyHistory: patient.familyHistory || '',
      password: '' // On ne charge jamais le mdp, il reste vide sauf si on le change
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce patient ? Attention, ses historiques médicaux liés pourraient être perdus.")) return;
    try {
      await api.delete(`/patients/${id}`);
      toast.success("Patient supprimé");
      fetchPatients();
    } catch (error) {
      toast.error("Erreur lors de la suppression (le patient est probablement lié à des consultations)");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      // Nettoyer les données (ne pas envoyer le mdp s'il est vide)
      const payload: any = { ...formData };
      if (!payload.password.trim()) {
        delete payload.password;
      }

      await api.put(`/patients/${selectedPatient.id}`, payload);
      toast.success("Informations du patient mises à jour");
      setShowEditModal(false);
      fetchPatients();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            Gestion des Patients
          </h1>
          <p className="text-slate-500 mt-1">Consultez et modifiez les dossiers administratifs des patients.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher (Nom, N°, Téléphone)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </header>

      {/* TABLEAU */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-sm uppercase tracking-wider">
                <th className="p-4 pl-6">N° Dossier</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Groupe Sanguin</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">Chargement...</td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">Aucun patient trouvé.</td>
                </tr>
              ) : (
                filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6 font-mono text-sm text-slate-500">{p.uniqueNumber}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-slate-500">{p.email || 'Pas d\'email'}</p>
                    </td>
                    <td className="p-4 text-slate-600">{p.phone || 'Non renseigné'}</td>
                    <td className="p-4">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold text-sm">
                        {p.bloodGroup || '?'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditClick(p)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDITION */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Edit2 className="text-blue-600" />
                Modifier le Patient
              </h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Prénom</label>
                  <input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Nom</label>
                  <input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Téléphone</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Groupe Sanguin</label>
                  <select value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500">
                    <option value="">Non renseigné</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-2">Antécédent Familial</label>
                  <textarea 
                    value={formData.familyHistory} 
                    onChange={e => setFormData({...formData, familyHistory: e.target.value})} 
                    placeholder="Ex: Diabète type 2 côté maternel, hypertension..."
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6">
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                  <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-2">
                    <Lock size={18} />
                    Sécurité - Mot de passe
                  </h3>
                  <p className="text-sm text-orange-700 mb-4">Laissez ce champ vide si vous ne souhaitez pas modifier le mot de passe du patient.</p>
                  <div>
                    <label className="block text-sm font-bold mb-2">Nouveau mot de passe</label>
                    <input 
                      type="text" 
                      placeholder="Saisissez un nouveau mot de passe..."
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      className="w-full p-3 border border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  Annuler
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
