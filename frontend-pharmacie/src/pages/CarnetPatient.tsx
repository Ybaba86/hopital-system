import { useState, useEffect } from 'react';
import { Users, Search, Activity, FileText, CheckCircle2, XCircle, Printer } from 'lucide-react';
import api from '../services/api';
import ReceiptModal from '../components/ReceiptModal';

export default function CarnetPatient() {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSales, setPatientSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<any>(null);

  useEffect(() => {
    api.get('/patients').then(res => setPatients(res.data)).catch(console.error);
  }, []);

  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    setSearchTerm('');
    setLoading(true);
    try {
      const res = await api.get(`/sales/patient/${patient.id}`);
      setPatientSales(res.data);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du chargement de l'historique.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName} ${p.uniqueNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCancelSale = async (saleId: string) => {
    if (!window.confirm("Voulez-vous vraiment annuler cette vente ? Les stocks seront recrédités et l'ordonnance redeviendra valide.")) return;
    
    setCancellingId(saleId);
    try {
      await api.put(`/sales/${saleId}/cancel`);
      alert("Vente annulée avec succès");
      // Recharger l'historique
      const res = await api.get(`/sales/patient/${selectedPatient.id}`);
      setPatientSales(res.data);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Erreur lors de l'annulation");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-3 sm:p-6 flex-1 flex flex-col min-h-0 gap-4 sm:gap-8">
      <div className="flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Users className="text-blue-500 w-7 h-7 sm:w-8 sm:h-8" />
          Carnet Patient
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1 sm:mt-2 font-medium">Recherchez un patient pour consulter son historique d'achats (Dossier Pharmaceutique)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 flex-1 min-h-0">
        
        {/* Colonne Recherche */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col max-h-[280px] lg:max-h-none lg:h-full min-h-0">
          <div className="relative mb-6 flex-shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Chercher un patient (nom, n° dossier)..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-2">
            {searchTerm && filteredPatients.map(p => (
              <div 
                key={p.id} 
                onClick={() => handleSelectPatient(p)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedPatient?.id === p.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
              >
                <p className="font-bold text-slate-800">{p.firstName} {p.lastName}</p>
                <p className="text-xs text-slate-500">Dossier: {p.uniqueNumber}</p>
              </div>
            ))}
            {searchTerm && filteredPatients.length === 0 && (
              <p className="text-center text-slate-400 py-4 text-sm font-bold">Aucun patient trouvé</p>
            )}
            {!searchTerm && !selectedPatient && (
              <div className="text-center py-10 text-slate-400">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium text-sm">Commencez par taper le nom d'un patient pour voir son dossier.</p>
              </div>
            )}
          </div>
        </div>

        {/* Colonne Dossier */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-0">
          {selectedPatient ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="bg-slate-900 p-8 text-white">
                <div className="flex items-center gap-4 mb-2">
                  <div className="bg-blue-500/20 p-3 rounded-2xl text-blue-400">
                    <Activity size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                    <p className="text-slate-400 font-medium">Dossier N° {selectedPatient.uniqueNumber}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 bg-slate-50/50 flex flex-col min-h-0">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 flex-shrink-0">
                  <FileText className="text-blue-500" size={20} />
                  Historique des Achats
                </h3>

                {loading ? (
                  <p className="text-center text-slate-400 py-10">Chargement de l'historique...</p>
                ) : patientSales.length > 0 ? (
                  <div className="space-y-6 overflow-y-auto flex-1 pr-4">
                    {patientSales.map(sale => (
                      <div key={sale.id} className={`bg-white p-6 rounded-2xl border shadow-sm ${sale.status === 'cancelled' ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                          <div>
                            <p className="text-sm font-bold text-slate-500 uppercase">
                              {new Date(sale.paymentDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                            </p>
                            <p className="text-sm font-medium text-slate-600 mt-1">Prescrit par : Dr. {sale.prescription?.consultation?.doctor?.name}</p>
                          </div>
                          <div className="text-right">
                            {sale.status === 'cancelled' ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                  <XCircle size={14} /> Annulée
                                </span>
                                <button
                                  onClick={() => setSelectedSaleForReceipt({ ...sale, patient: selectedPatient })}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                  title="Imprimer / Réimprimer la facture"
                                >
                                  <Printer size={13} />
                                  <span>Reçu</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                    <CheckCircle2 size={14} /> Validée
                                  </span>
                                  <button
                                    onClick={() => setSelectedSaleForReceipt({ ...sale, patient: selectedPatient })}
                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                    title="Imprimer / Réimprimer la facture"
                                  >
                                    <Printer size={13} />
                                    <span>Reçu</span>
                                  </button>
                                </div>
                                <button 
                                  onClick={() => handleCancelSale(sale.id)}
                                  disabled={cancellingId === sale.id}
                                  className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  {cancellingId === sale.id ? 'Annulation...' : 'Annuler la vente'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          {sale.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                              <div>
                                <p className={`font-bold ${sale.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.medicine.name}</p>
                                <p className="text-xs text-slate-500">{item.quantity} boîte(s) x {item.unitPrice} FCFA</p>
                              </div>
                              <p className={`font-bold ${sale.status === 'cancelled' ? 'text-slate-400' : 'text-slate-700'}`}>{item.total} FCFA</p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 border-dashed">
                          <span className="text-sm font-bold text-slate-500">Total payé</span>
                          <span className={`text-xl font-black ${sale.status === 'cancelled' ? 'text-slate-400' : 'text-slate-900'}`}>{sale.totalAmount} FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl border-dashed">
                    <p className="font-bold text-slate-600">Aucun achat</p>
                    <p className="text-sm text-slate-400">Ce patient n'a pas encore acheté de médicaments.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-[2rem] border border-slate-200 border-dashed p-10 min-h-[400px]">
              <Users size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-bold text-slate-600">Dossier Patient</p>
              <p className="text-center text-sm mt-2 max-w-sm">Sélectionnez un patient dans la liste de gauche pour afficher tout son historique de médicaments achetés.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'impression du reçu */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}
    </div>
  );
}
