import { useEffect, useState } from 'react';
import { Beaker, Search, Calendar, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import api from '../services/api';

export default function ArchivesLabo() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'ALL' | 'BIOLOGY' | 'IMAGING'>('ALL');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get('/lab/all-results');
        setResults(res.data);
      } catch (error) {
        console.error("Erreur de chargement des archives:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const filteredResults = results.filter(r => {
    const matchesSearch = `${r.patient?.firstName} ${r.patient?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.prescription?.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategoryTab === 'ALL' || (r.category || 'BIOLOGY') === activeCategoryTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-6 space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-2.5 sm:gap-3">
            <Beaker className="text-emerald-600 w-7 h-7 sm:w-8 sm:h-8" />
            Archives des Résultats Examens
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1 sm:mt-2 font-medium">Historique complet des analyses biologiques et imageries médicales.</p>
        </div>

        {/* Onglets Menu Résultats */}
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl gap-1.5 sm:gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveCategoryTab('ALL')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all text-center ${
              activeCategoryTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Tous les Examens
          </button>
          <button
            onClick={() => setActiveCategoryTab('BIOLOGY')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all text-center ${
              activeCategoryTab === 'BIOLOGY' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            🔬 Analyses Biologiques
          </button>
          <button
            onClick={() => setActiveCategoryTab('IMAGING')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all text-center ${
              activeCategoryTab === 'IMAGING' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            🩻 Imageries Médicales
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher par patient, examen médical..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 text-lg font-medium">Aucun résultat d'examen médical trouvé dans les archives.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredResults.map(r => (
            <div key={r.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-shadow">
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    r.status === 'validated' ? 'bg-emerald-100 text-emerald-700' 
                    : r.status === 'pending_review' ? 'bg-blue-100 text-blue-700' 
                    : r.status === 'paid' ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-700'
                  }`}>
                    {r.status === 'validated' ? 'Validé par le médecin' 
                    : r.status === 'pending_review' ? 'En attente de validation' 
                    : r.status === 'paid' ? 'Payé (À traiter)' 
                    : 'Non payé'}
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 uppercase">
                    {r.category === 'IMAGING' ? '🩻 Imagerie Médicale' : '🔬 Analyse Biologique'}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase">
                    <Calendar size={14} />
                    {new Date(r.createdAt).toLocaleDateString('fr-FR')} à {new Date(r.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1">
                  Patient : {r.patient?.firstName} {r.patient?.lastName} <span className="text-slate-400 text-sm font-normal">({r.patient?.uniqueNumber})</span>
                </h3>
                <p className="text-sm font-medium text-slate-600 mb-4">Prescrit par Dr. {r.doctor?.name}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Détails de la Demande d’Examen Médical</p>
                    <p className="text-slate-700 text-sm">{r.prescription?.content || 'Non spécifié'}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Résultat saisi</p>
                    <p className="text-slate-700 text-sm">
                      {r.result ? r.result : (r.status === 'pending' || r.status === 'paid' ? "L'analyse n'a pas encore été effectuée." : "Aucun texte saisi")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 min-w-[200px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                {r.fileUrl ? (
                  <a 
                    href={`http://localhost:3000${r.fileUrl}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full flex justify-center items-center gap-2 p-3 bg-emerald-50 text-emerald-700 hover:text-white hover:bg-emerald-600 rounded-xl font-bold transition-all"
                  >
                    <Download size={18} /> Voir le PDF
                  </a>
                ) : (
                  <div className="w-full p-3 bg-slate-50 text-slate-400 rounded-xl text-center text-sm font-medium border border-slate-100 flex items-center justify-center gap-2">
                    <AlertCircle size={16} /> Pas de fichier joint
                  </div>
                )}
                
                {r.status === 'validated' && (
                  <div className="w-full p-3 bg-green-50 rounded-xl border border-green-100 mt-auto">
                    <p className="text-xs font-bold text-green-700 uppercase flex items-center gap-1 mb-1">
                      <CheckCircle2 size={14} /> Approuvé
                    </p>
                    {r.doctorNotes && (
                      <p className="text-xs text-slate-600 line-clamp-2">Note: {r.doctorNotes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
