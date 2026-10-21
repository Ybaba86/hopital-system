import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Shield, Search, Loader2, X } from 'lucide-react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  hospitalId?: string;
  pharmacyId?: string;
  laboratoryId?: string;
  hospital?: { name: string };
  pharmacy?: { name: string };
  laboratory?: { name: string };
}

const ROLES = ['ADMIN', 'MEDECIN', 'CAISSIER', 'INFIRMIER', 'LABORANTIN', 'PHARMACIEN'];

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', password: '', role: '', hospitalId: '', pharmacyId: '', laboratoryId: '' });
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Add User State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'ADMIN', hospitalId: '', pharmacyId: '', laboratoryId: '' });
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [laboratories, setLaboratories] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [resUsers, resHospitals, resPharmacies, resLaboratories] = await Promise.all([
        api.get('/admin/users'),
        api.get('/hospitals'),
        api.get('/pharmacies'),
        api.get('/laboratories')
      ]);
      setUsers(resUsers.data);
      setHospitals(resHospitals.data);
      setPharmacies(resPharmacies.data);
      setLaboratories(resLaboratories.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    try {
      await api.put(`/admin/users/${editingUser.id}`, editUserForm);
      fetchUsers();
      setEditingUser(null);
    } catch (error) {
      alert('Erreur lors de la mise à jour de l\'utilisateur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return alert('Veuillez remplir tous les champs obligatoires');
    setSubmitting(true);
    try {
      await api.post('/admin/users', newUser);
      fetchUsers();
      setIsAddModalOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'ADMIN', hospitalId: '', pharmacyId: '', laboratoryId: '' });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700';
      case 'MEDECIN': return 'bg-blue-100 text-blue-700';
      case 'CAISSIER': return 'bg-emerald-100 text-emerald-700';
      case 'LABORANTIN': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-indigo-600" size={28} />
            Gestion des Utilisateurs
          </h2>
          <p className="text-slate-500 mt-1">Gérez les accès et les rôles du système.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/30 font-medium"
        >
          <Plus size={20} /> Nouvel Utilisateur
        </button>
      </div>

      <div className="bento-card p-0 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un utilisateur..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-medium transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold text-left">
              <tr>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Structure</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto mb-2 text-indigo-600" size={24} />
                    Chargement des données...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {u.role === 'PHARMACIEN' ? (u.pharmacy?.name || '—') : u.role === 'LABORANTIN' ? (u.laboratory?.name || '—') : (u.hospital?.name || '—')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${getRoleBadgeColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { 
                            setEditingUser(u); 
                            setEditUserForm({ name: u.name, email: u.email, password: '', role: u.role, hospitalId: u.hospitalId || '', pharmacyId: u.pharmacyId || '', laboratoryId: u.laboratoryId || '' }); 
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteUser(u.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex justify-between items-center">
          <span>Affichage de {filteredUsers.length} utilisateur(s)</span>
        </div>
      </div>

      {/* Modal Changement de Rôle */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setEditingUser(null)}
          />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Modifier l'utilisateur</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={updateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nom complet</label>
                <input 
                  type="text" 
                  value={editUserForm.name}
                  onChange={e => setEditUserForm({...editUserForm, name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input 
                  type="email" 
                  value={editUserForm.email}
                  onChange={e => setEditUserForm({...editUserForm, email: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nouveau Mot de passe (Optionnel)</label>
                <input 
                  type="password" 
                  value={editUserForm.password}
                  onChange={e => setEditUserForm({...editUserForm, password: e.target.value})}
                  placeholder="Laissez vide pour ne pas modifier"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Rôle</label>
                <select 
                  value={editUserForm.role} 
                  onChange={e => setEditUserForm({...editUserForm, role: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              {editUserForm.role === 'PHARMACIEN' ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Pharmacie</label>
                  <select 
                    value={editUserForm.pharmacyId || ''} 
                    onChange={e => setEditUserForm({...editUserForm, pharmacyId: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    required
                  >
                    <option value="">-- Sélectionnez une pharmacie --</option>
                    {pharmacies.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              ) : editUserForm.role === 'LABORANTIN' ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Laboratoire</label>
                  <select 
                    value={editUserForm.laboratoryId || ''} 
                    onChange={e => setEditUserForm({...editUserForm, laboratoryId: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    required
                  >
                    <option value="">-- Sélectionnez un laboratoire --</option>
                    {laboratories.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              ) : editUserForm.role !== 'ADMIN' ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Hôpital</label>
                  <select 
                    value={editUserForm.hospitalId || ''} 
                    onChange={e => setEditUserForm({...editUserForm, hospitalId: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    required
                  >
                    <option value="">-- Sélectionnez un hôpital --</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="mt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)} 
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/30 flex justify-center items-center gap-2"
                >
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajout d'Utilisateur */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Nouvel Utilisateur</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nom complet</label>
                <input 
                  type="text" 
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input 
                  type="email" 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mot de passe</label>
                <input 
                  type="password" 
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Rôle</label>
                <select 
                  value={newUser.role} 
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {newUser.role === 'PHARMACIEN' ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Pharmacie</label>
                  <select 
                    value={newUser.pharmacyId || ''} 
                    onChange={e => setNewUser({...newUser, pharmacyId: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    required
                  >
                    <option value="">-- Sélectionnez une pharmacie --</option>
                    {pharmacies.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              ) : newUser.role === 'LABORANTIN' ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Laboratoire</label>
                  <select 
                    value={newUser.laboratoryId || ''} 
                    onChange={e => setNewUser({...newUser, laboratoryId: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    required
                  >
                    <option value="">-- Sélectionnez un laboratoire --</option>
                    {laboratories.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              ) : newUser.role !== 'ADMIN' ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Hôpital</label>
                  <select 
                    value={newUser.hospitalId || ''} 
                    onChange={e => setNewUser({...newUser, hospitalId: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    required
                  >
                    <option value="">-- Sélectionnez un hôpital --</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="mt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-sm flex justify-center items-center gap-2"
                >
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