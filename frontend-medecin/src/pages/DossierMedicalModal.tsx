import { useState, useEffect } from 'react';
import { X, History, PlusCircle, Calendar, Pill, AlertCircle, Edit2, Printer, Beaker, Download, CheckCircle2 } from 'lucide-react';
import Barcode from 'react-barcode';
import api from '../services/api';
import ConsultationForm from './ConsultationForm';

interface DossierMedicalModalProps {
  patientId: string;
  patientName: string;
  ticketId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DossierMedicalModal({ patientId, patientName, ticketId, onClose, onSuccess }: DossierMedicalModalProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'consultation'>('history');
  const [history, setHistory] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [editConsultationId, setEditConsultationId] = useState<string | undefined>();
  const [editInitialData, setEditInitialData] = useState<any>(undefined);
  const [selectedPrintPrescription, setSelectedPrintPrescription] = useState<{ p: any, cons: any } | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [consRes, labRes, patRes] = await Promise.all([
        api.get(`/consultations?patientId=${patientId}`),
        api.get(`/lab/results/patient/${patientId}`),
        api.get(`/patients/${patientId}`).catch(() => null)
      ]);
      setHistory(consRes.data);
      setLabResults(labRes.data);
      if (patRes?.data) {
        setPatientDetails(patRes.data);
      }
    } catch (error) {
      console.error("Erreur chargement historique:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (consultation: any) => {
    setEditConsultationId(consultation.id);
    setEditInitialData(consultation);
    setActiveTab('consultation');
  };

  const handleNewConsultationClick = () => {
    setEditConsultationId(undefined);
    setEditInitialData(undefined);
    setActiveTab('consultation');
  };

  const handleConsultationSuccess = () => {
    onSuccess();
    onClose();
  };

  const handlePrintPrescription = (p: any, cons: any) => {
    setSelectedPrintPrescription({ p, cons });
    
    // Sauvegarder le titre original
    const originalTitle = document.title;
    // Mettre un titre propre pour le nom du fichier PDF
    document.title = `Ordonnance_${patientName.replace(/\s+/g, '_')}_${new Date(cons.date).toISOString().slice(0,10)}`;
    
    setTimeout(() => {
      window.print();
      // Restaurer le titre
      document.title = originalTitle;
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200 print:bg-transparent print:p-0">
      <div className="bg-slate-50 rounded-2xl sm:rounded-[2.5rem] shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-white relative print:hidden">
        
        <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sm:py-6 flex flex-col md:flex-row justify-between items-start md:items-center z-10 sticky top-0 gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <h2 className="text-xl sm:text-3xl font-black text-slate-800 truncate">Dossier: {patientName}</h2>
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'history' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <History size={16} />
                Carnet Médical
              </button>
              <button
                onClick={handleNewConsultationClick}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'consultation' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {editConsultationId ? (
                  <><Edit2 size={16} /> Modifier</>
                ) : (
                  <><PlusCircle size={16} /> Consultation</>
                )}
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 sm:static bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 sm:p-3 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
          {activeTab === 'history' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Résumé Médical du Patient (Antécédents & Groupe Sanguin) */}
              {patientDetails && (
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-lg border border-indigo-700/30">
                  <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertCircle size={16} /> Profil Clinique & Antécédents
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                      <span className="text-xs font-bold text-indigo-200 block mb-1">Groupe Sanguin</span>
                      <span className="text-xl font-black text-white">{patientDetails.bloodGroup || 'Non renseigné'}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                      <span className="text-xs font-bold text-red-300 block mb-1">Allergies Connues</span>
                      <span className="text-sm font-bold text-white">{patientDetails.allergies || 'Aucune allergie signalée'}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                      <span className="text-xs font-bold text-amber-300 block mb-1">Antécédents Personnels</span>
                      <span className="text-sm font-medium text-white">{patientDetails.medicalHistory || 'Aucun'}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                      <span className="text-xs font-bold text-emerald-300 block mb-1">Antécédent Familial</span>
                      <span className="text-sm font-medium text-white">{patientDetails.familyHistory || 'Aucun'}</span>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                  <History className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 text-lg font-medium">Aucun historique de consultation pour ce patient.</p>
                </div>
              ) : (
                history.map((cons) => (
                  <div key={cons.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                    <button 
                      onClick={() => handleEditClick(cons)}
                      className="absolute top-6 right-6 flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl font-bold transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Edit2 size={16} /> Modifier
                    </button>
                    
                    <div className="flex items-center gap-4 mb-6 pr-32">
                      <div className="bg-slate-100 p-4 rounded-2xl text-slate-500">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-slate-800">
                          {new Date(cons.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-slate-500 text-sm">
                          Dr. {cons.doctor?.name} • {new Date(cons.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-red-50/50 p-4 rounded-2xl border border-red-50">
                        <h4 className="text-sm font-bold text-red-800 uppercase mb-2 flex items-center gap-2">
                          <AlertCircle size={16} /> Renseignement Clinique (Motif de la consultation)
                        </h4>
                        <p className="text-slate-700 whitespace-pre-wrap">{cons.symptoms}</p>
                      </div>
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-50">
                        <h4 className="text-sm font-bold text-blue-800 uppercase mb-2">Diagnostic</h4>
                        <p className="text-slate-700 whitespace-pre-wrap">{cons.diagnosis}</p>
                      </div>
                      {cons.treatment && (
                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-50 md:col-span-2">
                          <h4 className="text-sm font-bold text-emerald-800 uppercase mb-2 flex items-center gap-2">
                            <Pill size={16} /> Traitements Médicales (Prescription)
                          </h4>
                          <p className="text-slate-700 whitespace-pre-wrap">{cons.treatment}</p>
                        </div>
                      )}
                      
                      {cons.prescriptions && cons.prescriptions.length > 0 && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Ordonnances générées</h4>
                          <div className="flex flex-wrap gap-3">
                            {cons.prescriptions.map((p: any) => (
                              <div key={p.id} className="flex items-center gap-2">
                                <button 
                                  onClick={() => handlePrintPrescription(p, cons)}
                                  className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-200 hover:bg-indigo-200 transition-colors"
                                >
                                  <Printer size={16} /> 
                                  Imprimer Ordonnance ({p.type === 'medication' ? 'Médicaments' : 'Bulletin d’Analyse / Examen'})
                                </button>
                                {p.status === 'delivered' && (
                                  <span className="bg-green-100 text-green-700 px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 border border-green-200">
                                    <CheckCircle2 size={14} /> Délivrée en pharmacie
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {labResults.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <Beaker className="text-purple-600" size={28} />
                    Résultats Examens Médicaux
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    {labResults.map(r => (
                      <div key={r.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-purple-600 uppercase">
                              {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-800 uppercase">
                              {r.category === 'IMAGING' ? 'Imageries Médicales' : 'Analyses Biologiques'}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-1">{r.result || 'En attente de résultat'}</h3>
                          <p className="text-sm text-slate-500 mb-2">Prescrit par Dr. {r.doctor?.name}</p>
                          {r.status === 'validated' && r.doctorNotes && (
                            <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                              <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Vos notes</p>
                              <p className="text-slate-700 text-sm">{r.doctorNotes}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col md:items-end gap-3 min-w-[150px]">
                          <div className={`px-3 py-1 rounded-lg text-xs font-bold text-center ${
                            r.status === 'validated' ? 'bg-emerald-100 text-emerald-700' 
                            : r.status === 'pending_review' ? 'bg-blue-100 text-blue-700' 
                            : 'bg-orange-100 text-orange-700'
                          }`}>
                            {r.status === 'validated' ? 'Validé' : r.status === 'pending_review' ? 'À vérifier' : 'En traitement'}
                          </div>
                          {r.fileUrl && (
                            <a 
                              href={`http://localhost:3000${r.fileUrl}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex justify-center items-center gap-2 p-2 px-4 bg-purple-50 text-purple-700 hover:text-white hover:bg-purple-600 rounded-xl font-bold transition-all"
                            >
                              <Download size={18} /> Voir le PDF
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'consultation' && (
             <div className="bg-white rounded-[2rem] overflow-hidden">
                <ConsultationForm 
                  patientId={patientId}
                  patientName={patientName}
                  ticketId={ticketId}
                  consultationId={editConsultationId}
                  initialData={editInitialData}
                  onSuccess={handleConsultationSuccess}
                />
             </div>
          )}
        </div>
      </div>

      {/* ZONE D'IMPRESSION ORDONNANCE */}
      {selectedPrintPrescription && (
        <div className="hidden print:block printable-area bg-white z-[9999] p-10 text-black">
          <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider">{selectedPrintPrescription.cons.doctor?.hospital?.name || "Hôpital Central"}</h1>
              <p className="text-sm text-slate-600">Service des Consultations Médicales</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase">Ordonnance</h2>
              <p className="text-sm font-bold mt-1">Date : {new Date(selectedPrintPrescription.cons.date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className="flex justify-between mb-12">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Médecin traitant</p>
              <p className="font-bold text-lg">Dr. {selectedPrintPrescription.cons.doctor?.name}</p>
              <p className="text-sm text-slate-600">Spécialiste</p>
            </div>
            <div className="text-right border border-slate-300 p-4 rounded-xl min-w-[250px]">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Patient(e)</p>
              <p className="font-bold text-lg">{patientName}</p>
              <p className="text-sm text-slate-600">Dossier N° : {patientId}</p>
            </div>
          </div>

          <div className="mb-16 min-h-[400px]">
            <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-6">
              Prescription ({selectedPrintPrescription.p.type === 'medication' ? 'Médicaments' : 'Examens & Analyses'})
            </h3>
            <p className="whitespace-pre-wrap text-lg leading-relaxed">{selectedPrintPrescription.p.content}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end border-t border-slate-300 pt-8 mt-auto">
            <div className="text-left overflow-hidden">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                {selectedPrintPrescription.p.type === 'lab' ? 'Code Examens & Analyses' : 'Code Pharmacie'}
              </p>
              <div className="transform origin-left scale-75 max-w-full">
                <Barcode 
                  value={selectedPrintPrescription.p.qrCode || selectedPrintPrescription.p.id} 
                  height={50} 
                  width={1.2} 
                  displayValue={true} 
                  fontSize={14} 
                  background="transparent" 
                  margin={0}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 max-w-[200px]">
                {selectedPrintPrescription.p.type === 'lab' 
                  ? 'Scanner au laboratoire (Projet à venir)' 
                  : 'Scanner pour validation en pharmacie (Projet à venir)'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-500 mb-16">Signature & Cachet du Médecin</p>
              <div className="border-b border-slate-800 w-48 ml-auto"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
