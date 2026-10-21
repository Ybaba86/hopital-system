import { useState, useEffect } from 'react';
import { Microscope, Loader2, CheckCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function BoiteReceptionLabo() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [validating, setValidating] = useState(false);

  const medecin = JSON.parse(localStorage.getItem('medecin') || '{}');

  const fetchResults = async () => {
    try {
      const res = await api.get(`/lab/pending/${medecin.id}`);
      setResults(res.data);
    } catch (error) {
      toast.error('Erreur récupération des résultats labo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResult) return;

    setValidating(true);
    try {
      await api.post(`/lab/validate/${selectedResult.id}`, {
        doctorNotes,
        validatedBy: medecin.id
      });
      toast.success('Résultat validé ! Le patient peut maintenant le consulter.');
      setSelectedResult(null);
      setDoctorNotes('');
      fetchResults();
    } catch (error) {
      toast.error('Erreur de validation');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6 h-full flex flex-col overflow-hidden">
      <h2 className="text-3xl font-black mb-8 flex items-center gap-3 shrink-0">
        <Microscope className="text-blue-600" size={32} />
        Boîte de réception - Résultats Examens Médicaux
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0 overflow-hidden">
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col h-full overflow-hidden">
          <h3 className="font-bold text-xl mb-4 flex justify-between items-center shrink-0">
            Examens Médicaux en attente
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
              {results.length}
            </span>
          </h3>

          {loading ? (
            <div className="flex justify-center py-8 shrink-0"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : results.length === 0 ? (
            <p className="text-slate-500 text-center py-8 shrink-0">Aucun résultat en attente de validation.</p>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {results.map((r: any) => (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedResult(r)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-colors ${selectedResult?.id === r.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-bold text-slate-800">{r.patient.firstName} {r.patient.lastName}</p>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {r.category === 'IMAGING' ? 'Imagerie' : 'Biologie'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{new Date(r.createdAt).toLocaleString('fr-FR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 overflow-y-auto h-full pr-2">
          {selectedResult ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <h3 className="text-2xl font-black text-slate-800 mb-6">
                Résultats de {selectedResult.patient.firstName} {selectedResult.patient.lastName}
              </h3>

              <div className="mb-6">
                <p className="text-sm font-bold text-slate-700 mb-2">Compte Rendu du Laboratoire</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap">
                  {selectedResult.result || "Aucun commentaire texte du labo."}
                </div>
              </div>

              {selectedResult.fileUrl && (
                <div className="mb-8">
                  <p className="text-sm font-bold text-slate-700 mb-2">Fichier Joint (PDF)</p>
                  <a 
                    href={`http://localhost:3000${selectedResult.fileUrl}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl border border-blue-200 hover:bg-blue-100 font-bold transition-colors"
                  >
                    <FileText />
                    Ouvrir le document d'analyse
                  </a>
                </div>
              )}

              <form onSubmit={handleValidate} className="border-t border-slate-200 pt-6">
                <h4 className="font-bold text-lg mb-4">Validation Clinique</h4>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Interprétation Médicale & Conduite à tenir (Visible par le patient)</label>
                  <textarea
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    placeholder="Vos conclusions sur ces analyses..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={validating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {validating ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                  Valider et clôturer ce résultat
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center h-[500px]">
              <Microscope size={64} className="text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-600">Sélectionnez un résultat</h3>
              <p className="text-slate-500">Cliquez sur un patient dans la liste de gauche pour analyser son dossier labo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
