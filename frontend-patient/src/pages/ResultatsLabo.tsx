import { useEffect, useState } from 'react';
import { Beaker, Download, Info, Image as ImageIcon, FileCheck2 } from 'lucide-react';
import api from '../services/api';

interface LabResult {
  id: string;
  result: string | null;
  doctorNotes: string | null;
  status: string;
  category?: string;
  fileUrl: string | null;
  createdAt: string;
  doctor: { name: string };
}

export default function ResultatsLabo() {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'BIOLOGY' | 'IMAGING'>('ALL');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get('/patient/lab-results');
        setResults(res.data);
      } catch (error) {
        console.error("Erreur chargement labo:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const isImaging = (r: LabResult) => {
    if (r.category === 'IMAGING') return true;
    const text = ((r.result || '') + ' ' + (r.doctorNotes || '')).toLowerCase();
    return text.includes('radio') || text.includes('écho') || text.includes('echo') || text.includes('irm') || text.includes('scanner') || text.includes('imagerie');
  };

  const filteredResults = results.filter(r => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'IMAGING') return isImaging(r);
    if (activeTab === 'BIOLOGY') return !isImaging(r);
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center justify-center md:justify-start gap-3">
            <FileCheck2 className="text-purple-600" size={32} />
            Résultats Examens Médicaux
          </h2>
          <p className="text-slate-500 mt-2">Retrouvez l'historique complet de vos analyses biologiques et imageries médicales.</p>
        </div>
      </header>

      {/* Menu / Tabs : Analyses Biologiques & Imageries Médicales */}
      <div className="flex items-center gap-2 mb-8 bg-slate-100/80 p-1.5 rounded-2xl w-fit mx-auto md:mx-0 border border-slate-200">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'ALL'
              ? 'bg-white text-slate-900 shadow-sm shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tous les examens ({results.length})
        </button>
        <button
          onClick={() => setActiveTab('BIOLOGY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'BIOLOGY'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'text-slate-600 hover:text-purple-600'
          }`}
        >
          <Beaker size={16} />
          Analyses Biologiques
        </button>
        <button
          onClick={() => setActiveTab('IMAGING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'IMAGING'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <ImageIcon size={16} />
          Imageries Médicales
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-medium italic">
            Aucun résultat d'examen trouvé pour cette catégorie.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-8 pl-8">
          {filteredResults.map(r => {
            const imaging = isImaging(r);
            return (
              <div key={r.id} className="relative group">
                {/* Point sur la timeline */}
                <div className={`absolute -left-[41px] top-0 bg-white border-4 h-6 w-6 rounded-full group-hover:scale-125 transition-transform ${
                  imaging ? 'border-indigo-600' : 'border-purple-600'
                }`} />
                
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-purple-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        imaging 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {imaging ? '📷 Imagerie Médicale' : '🧪 Analyse Biologique'}
                      </span>
                      <p className="text-xs font-bold text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{r.result || 'Résultats en cours de traitement'}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                      <Info size={14} /> Prescrit par Dr. {r.doctor?.name}
                    </p>

                    {r.status === 'validated' && (
                      <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Interprétation Médicale</p>
                        <p className="text-slate-700 text-sm">{r.doctorNotes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end gap-3 mt-4 md:mt-0 min-w-[150px]">
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      r.status === 'validated' ? 'bg-emerald-100 text-emerald-700' 
                      : r.status === 'pending_review' ? 'bg-blue-100 text-blue-700' 
                      : 'bg-orange-100 text-orange-700'
                    }`}>
                      {r.status === 'validated' ? 'Validé (Terminé)' : r.status === 'pending_review' ? 'En revue médicale' : 'En traitement labo'}
                    </div>
                    
                    {r.fileUrl && (
                      <a 
                        href={`http://localhost:3000${r.fileUrl}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 p-2 px-4 bg-purple-50 text-purple-700 hover:text-white hover:bg-purple-600 rounded-xl font-bold transition-all"
                      >
                        <Download size={18} /> Télécharger
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}