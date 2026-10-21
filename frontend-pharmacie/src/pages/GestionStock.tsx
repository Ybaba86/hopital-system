import { useState, useEffect } from 'react';
import { PackageSearch, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function GestionStock() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Formulaire d'ajout / modification
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '', name: '', description: '', stock: 0, price: 0, supplier: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medicines');
      setMedicines(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/medicines/${formData.id}`, formData);
      } else {
        await api.post('/medicines', formData);
      }
      fetchMedicines();
      setShowForm(false);
      setFormData({ id: '', name: '', description: '', stock: 0, price: 0, supplier: '' });
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (med: any) => {
    setFormData(med);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('Voulez-vous vraiment supprimer ce médicament ?')) {
      try {
        await api.delete(`/medicines/${id}`);
        fetchMedicines();
      } catch (error) {
        alert("Impossible de supprimer ce médicament (il est peut-être lié à des ventes).");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-3 sm:p-6 flex-1 flex flex-col min-h-0 gap-6 sm:gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <PackageSearch className="text-green-500 w-7 h-7 sm:w-8 sm:h-8" />
            Gestion des Stocks
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1 sm:mt-2 font-medium">Consultez et mettez à jour l'inventaire de la pharmacie</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ id: '', name: '', description: '', stock: 0, price: 0, supplier: '' });
            setShowForm(true);
          }}
          className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all text-sm sm:text-base"
        >
          <Plus size={20} />
          Nouveau Médicament
        </button>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 flex-shrink-0">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un médicament..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 font-medium text-sm sm:text-base"
            />
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-500">
            Total : {filteredMedicines.length} références
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Chargement...</div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left relative min-w-[600px]">
              <thead className="sticky top-0 z-10 bg-white shadow-sm">
                <tr className="border-b border-slate-100">
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider">Médicament</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider">Description</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Prix Unitaire</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Stock</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMedicines.map(med => (
                <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{med.name}</td>
                  <td className="py-4 px-6 text-slate-500 text-sm max-w-xs truncate">{med.description}</td>
                  <td className="py-4 px-6 font-bold text-slate-700 text-right">{med.price} FCFA</td>
                  <td className="py-4 px-6 text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${
                      med.stock > 20 ? 'bg-green-100 text-green-700' : med.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {med.stock}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(med)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(med.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">
              {formData.id ? 'Modifier le médicament' : 'Nouveau médicament'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nom du médicament</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description / Catégorie</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Prix (FCFA)</label>
                  <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Quantité (Stock)</label>
                  <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Fournisseur</label>
                <input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
