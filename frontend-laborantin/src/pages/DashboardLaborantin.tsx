import { useState, useEffect, useRef } from 'react';
import { Users2, Upload, Loader2, X, FileText, CheckCircle2, ScanBarcode } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function DashboardLaborantin() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPatient, setCurrentPatient] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  
  const [resultText, setResultText] = useState('');
  const [category, setCategory] = useState<'BIOLOGY' | 'IMAGING'>('BIOLOGY');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const laborantin = JSON.parse(localStorage.getItem('laborantin') || '{}');

  const fetchQueue = async () => {
    if (!laborantin.hospitalId) {
      if (!toast.custom.name) {
        toast.error("Votre compte n'est rattaché à aucun hôpital. Veuillez contacter l'administrateur.", { id: 'hospital-error' });
      }
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/queue/waiting?hospitalId=${laborantin.hospitalId}&queueType=laboratory`);
      setQueue(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    let interval: any;
    if (laborantin.hospitalId) {
      interval = setInterval(fetchQueue, 5000);
    }
    return () => clearInterval(interval);
  }, []);

  const callNextPatient = async () => {
    try {
      const res = await api.post('/queue/call-next-lab', { hospitalId: laborantin.hospitalId });
      toast.success(res.data.message);
      
      const ticket = res.data.ticket;
      setCurrentPatient(ticket);
      fetchPatientPrescriptions(ticket.patientId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur d'appel");
    }
  };

  const fetchPatientPrescriptions = async (patientId: string) => {
    try {
      const res = await api.get(`/lab/prescriptions/patient/${patientId}`);
      setPrescriptions(res.data);
      if (res.data.length > 0) {
        setSelectedPrescription(res.data[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des ordonnances');
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrescription) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append('prescriptionId', selectedPrescription.id);
    formData.append('patientId', currentPatient.patientId);
    formData.append('doctorId', selectedPrescription.consultation.doctorId);
    formData.append('resultText', resultText);
    formData.append('category', category);
    if (currentPatient.id) {
      formData.append('ticketId', currentPatient.id);
    }
    if (file) {
      formData.append('resultFile', file);
    }

    try {
      await api.post('/lab/submit-result', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Résultats envoyés au médecin avec succès !');
      setCurrentPatient(null);
      setResultText('');
      setFile(null);
      fetchQueue();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5 sm:gap-3 text-slate-800">
          <Users2 className="text-emerald-600 w-7 h-7 sm:w-8 sm:h-8" />
          File d'attente Laboratoire
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={callNextPatient}
            disabled={queue.length === 0 || currentPatient}
            className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-5 sm:px-8 py-2.5 sm:py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 text-sm sm:text-base"
          >
            Appeler le patient suivant
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('laborantinToken');
              localStorage.removeItem('laborantin');
              window.location.href = '/';
            }}
            className="w-full sm:w-auto justify-center bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold transition-all text-sm sm:text-base"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste d'attente */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 h-fit">
          <h3 className="font-bold text-xl mb-4 flex justify-between items-center">
            Patients en attente
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">
              {queue.length}
            </span>
          </h3>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-500" /></div>
          ) : queue.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-500 font-medium">Aucun patient en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map(ticket => (
                <div key={ticket.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">{ticket.patient.firstName} {ticket.patient.lastName}</p>
                    <p className="text-xs text-slate-500">Ticket #{ticket.ticketNumber}</p>
                  </div>
                  {ticket.isEmergency && (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-lg">Urgence</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Espace de saisie */}
        <div className="lg:col-span-2">
          {currentPatient ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">
                    {currentPatient.patient.firstName} {currentPatient.patient.lastName}
                  </h3>
                  <p className="text-slate-500">Ticket #{currentPatient.ticketNumber}</p>
                </div>
                <button 
                  onClick={() => setCurrentPatient(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              {prescriptions.length === 0 ? (
                <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-xl">
                  Aucune ordonnance d'analyse payée trouvée pour ce patient.
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Sélectionner l'ordonnance à traiter</label>
                    <select
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={selectedPrescription?.id || ''}
                      onChange={(e) => setSelectedPrescription(prescriptions.find(p => p.id === e.target.value))}
                    >
                      {prescriptions.map(p => (
                        <option key={p.id} value={p.id}>
                          Analyse prescrite par Dr. {p.consultation.doctor.name} - {new Date(p.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPrescription && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                      <p className="text-xs text-blue-600 font-bold uppercase mb-1">Demande d’Examen Médical</p>
                      <p className="text-slate-800 whitespace-pre-wrap">{selectedPrescription.content}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmitResult} className="space-y-6 mt-8 border-t border-slate-100 pt-8">
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

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Observations (Optionnel)</label>
                      <textarea
                        value={resultText}
                        onChange={e => setResultText(e.target.value)}
                        className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 h-32"
                        placeholder="Saisissez des commentaires éventuels..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || (!file && !resultText)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-200 flex justify-center items-center gap-2"
                    >
                      {submitting ? <Loader2 className="animate-spin" /> : <FileText />}
                      Transmettre les résultats au médecin
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              
              <ScanBarcode size={64} className="text-emerald-400 mb-6 relative z-10" />
              <h3 className="text-2xl font-black text-slate-800 mb-2 relative z-10">Gestion Rapide</h3>
              <p className="text-slate-500 mb-8 max-w-sm relative z-10">
                Scannez ou saisissez le code du Bulletin d’Analyse / Examen pour traiter le patient immédiatement sans utiliser la file d'attente.
              </p>
              <Link to="/scanner" className="bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-slate-900/30 transition-all relative z-10">
                Ouvrir le Bulletin d’Analyse
              </Link>
              
              <div className="mt-8 pt-8 border-t border-slate-200/60 w-full relative z-10">
                <p className="text-slate-500 text-sm">Ou cliquez sur "Appeler le patient suivant" pour traiter la file.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
