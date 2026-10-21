import { useState, useRef } from 'react';
import { ScanBarcode, Search, CheckCircle2, FileText, Upload, Loader2, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ScannerLabo() {
  const [qrCode, setQrCode] = useState('');
  const [prescription, setPrescription] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Soumission
  const [resultText, setResultText] = useState('');
  const [category, setCategory] = useState<'BIOLOGY' | 'IMAGING'>('BIOLOGY');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if(!qrCode.trim()) return;

    setLoading(true);
    setError('');
    setPrescription(null);
    setResultText('');
    setFile(null);

    try {
      const res = await api.get(`/lab/prescription/qr/${qrCode}`);
      setPrescription(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de la recherche du bulletin");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescription) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append('prescriptionId', prescription.id);
    formData.append('patientId', prescription.consultation.patient.id);
    formData.append('doctorId', prescription.consultation.doctor.id);
    formData.append('resultText', resultText);
    formData.append('category', category);
    if (file) {
      formData.append('resultFile', file);
    }

    try {
      await api.post('/lab/submit-result', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Résultats envoyés au médecin avec succès !');
      
      setPrescription(null);
      setQrCode('');
      setResultText('');
      setFile(null);
    } catch (err: any) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-6 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Zone de Scan */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <ScanBarcode className="text-emerald-500 w-6 h-6 sm:w-7 sm:h-7" />
          Bulletin d’Analyse (Analyses & Imageries)
        </h1>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Code du Bulletin d’Analyse / Examen..." 
              className="w-full pl-11 pr-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base sm:text-lg font-bold"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 text-sm sm:text-base flex justify-center items-center"
          >
            {loading ? 'Recherche...' : 'Valider'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold">
            {error}
          </div>
        )}
      </div>

      {prescription && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Détails de l'ordonnance */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><UserCircle2 size={16} /> Patient</p>
                <h3 className="text-2xl font-black text-slate-800">
                  {prescription.consultation.patient.firstName} {prescription.consultation.patient.lastName}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Prescripteur</p>
                <h3 className="text-lg font-bold text-slate-700">Dr. {prescription.consultation.doctor.name}</h3>
                <p className="text-xs text-slate-400">{new Date(prescription.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4">Demande d’Examen Médical</h4>
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/50">
                <p className="text-slate-700 text-lg whitespace-pre-wrap leading-relaxed">{prescription.content}</p>
              </div>
            </div>
            
            {prescription.status !== 'paid' && !prescription.hasResult && (
               <div className="mt-6 p-4 bg-orange-50 text-orange-700 rounded-2xl border border-orange-200 font-bold flex items-center gap-2">
                 Attention : Ce bulletin d'examen n'a pas encore été payé à la caisse.
               </div>
            )}
            
            {prescription.hasResult && (
              <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-200 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 size={20} />
                Les résultats pour ce bulletin d'examen ont déjà été transmis
              </div>
            )}
          </div>

          {/* Formulaire de saisie des résultats */}
          {!prescription.hasResult && (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <FileText className="text-emerald-500" size={24} />
                Saisie des Résultats Examens Médicaux
              </h3>

              <form onSubmit={handleSubmitResult} className="space-y-6 flex-1 flex flex-col">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Type d'examen médical</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setCategory('BIOLOGY')}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                        category === 'BIOLOGY'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🔬 Analyses Biologiques
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory('IMAGING')}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                        category === 'IMAGING'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🩻 Imageries Médicales
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Importer le résultat (PDF)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}`}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    {file ? (
                      <div className="flex flex-col items-center text-emerald-600">
                        <CheckCircle2 size={32} className="mb-2" />
                        <span className="font-bold">{file.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-500">
                        <Upload size={32} className="mb-2 text-slate-400" />
                        <span className="font-bold mb-1">Cliquez pour importer un PDF</span>
                        <span className="text-sm">Taille max: 5Mo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Observations ou Résultat texte</label>
                  <textarea
                    value={resultText}
                    onChange={e => setResultText(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 h-full min-h-[150px]"
                    placeholder="Saisissez les résultats ou des commentaires éventuels..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || (!file && !resultText)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-200 flex justify-center items-center gap-2 mt-auto"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <FileText />}
                  Transmettre les résultats au médecin
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
