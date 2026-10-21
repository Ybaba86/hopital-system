import { useEffect, useState } from 'react';
import { FileText, ShieldCheck, Printer, Search, Pill } from 'lucide-react';
import api from '../services/api';
import Barcode from 'react-barcode';

interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isSubstituted?: boolean;
  originalMedicineName?: string;
}

interface Prescription {
  id: string;
  type: string;
  content: string;
  qrCode: string;
  doctorName: string;
  hospitalName: string;
  consultationDate: string;
  status: string;
  pharmacyName?: string;
  laboratoryName?: string;
  sale?: {
    id: string;
    totalAmount: number;
    paymentDate: string;
    status: string;
    pharmacyName?: string;
    items: SaleItem[];
  } | null;
}

export default function OrdonnancesPatient() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedPrintPrescription, setSelectedPrintPrescription] = useState<Prescription | null>(null);
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const storedPatient = localStorage.getItem('patient');
        if (storedPatient) setPatientData(JSON.parse(storedPatient));

        const res = await api.get('/patient/prescriptions');
        setPrescriptions(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Erreur chargement ordonnances:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter(p => 
    p.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = (p: Prescription) => {
    setSelectedPrintPrescription(p);
    
    // Sauvegarder le titre original
    const originalTitle = document.title;
    // Mettre un titre propre pour le nom du fichier PDF
    document.title = `Ordonnance_${p.doctorName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}`;
    
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 100);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 print:p-0 print:bg-transparent">
      {/* Wrapper principal masqué à l'impression */}
      <div className="print:hidden">
      {/* Header & Recherche */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileText className="text-emerald-600" size={32} />
            Mes ordonnances
          </h2>
          <p className="text-slate-500 mt-1">Consultez et présentez vos ordonnances en pharmacie.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64" 
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {filteredPrescriptions.length > 0 ? (
            filteredPrescriptions.map(p => (
              <div key={p.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-black uppercase italic">
                      {p.type}
                    </div>
                    <button 
                      onClick={() => handlePrint(p)}
                      className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all font-bold"
                    >
                      <Printer size={18} />
                      Imprimer
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900">Dr. {p.doctorName}</h3>
                  <p className="text-sm text-slate-400 mb-4 font-medium">
                    Délivrée le {p.consultationDate ? new Date(p.consultationDate).toLocaleDateString('fr-FR') : 'Non datée'}
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {p.content}
                    </p>
                  </div>
                </div>

                {/* Affichage du Code Barres pour présentation directe */}
                {p.qrCode && p.status !== 'delivered' && p.status !== 'validated_lab' && (
                  <div className="bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-2 rounded-xl mb-3 inline-block">
                      <Barcode 
                        value={p.qrCode} 
                        height={40} 
                        width={1.5} 
                        displayValue={true} 
                        fontSize={14} 
                        background="transparent" 
                        margin={0}
                      />
                    </div>
                    <p className="text-sm font-bold text-white flex items-center gap-2 justify-center">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      Code {p.type === 'lab' ? 'Examens & Analyses' : 'Pharmacie'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest">
                      Présentez ce code {p.type === 'lab' ? 'au laboratoire' : 'à la pharmacie'}
                    </p>
                  </div>
                )}
                {p.status === 'delivered' && (
                  <div className="bg-emerald-50/90 p-5 flex flex-col justify-between border-t border-emerald-200">
                    <div className="text-emerald-900 mb-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black flex items-center gap-2 text-emerald-900">
                          <ShieldCheck size={18} className="text-emerald-600" />
                          Délivrée en Pharmacie
                        </p>
                        {p.sale?.totalAmount !== undefined && (
                          <span className="font-black text-emerald-800 text-sm bg-emerald-100/70 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                            {p.sale.totalAmount.toLocaleString()} FCFA
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-1 uppercase tracking-wider font-bold">
                        {p.pharmacyName || p.sale?.pharmacyName ? `Pharmacie : ${p.pharmacyName || p.sale?.pharmacyName}` : 'Officine hospitalière'}
                        {p.sale?.paymentDate && ` • Délivré le ${new Date(p.sale.paymentDate).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>

                    {/* Contenu détaillé de la vente en pharmacie */}
                    {p.sale?.items && p.sale.items.length > 0 && (
                      <div className="bg-white rounded-2xl border border-emerald-200/80 p-3.5 mb-2 shadow-xs">
                        <p className="text-[11px] font-black uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
                          <Pill size={14} className="text-emerald-600" />
                          Médicaments délivrés ({p.sale.items.length}) :
                        </p>
                        <div className="space-y-2">
                          {p.sale.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                              <div>
                                <span className="font-bold text-slate-800">{item.quantity}x {item.name}</span>
                                {item.isSubstituted && (
                                  <span className="block text-[10px] font-semibold text-amber-700 mt-0.5">
                                    ↪ Substitué (init. {item.originalMedicineName || 'princeps'})
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-slate-700 shrink-0 ml-2">
                                {item.total?.toLocaleString()} FCFA
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {p.status === 'validated_lab' && (
                  <div className="bg-blue-100 p-6 flex flex-col justify-between border-t border-blue-200">
                    <div className="text-blue-800 mb-2">
                      <p className="text-sm font-black flex items-center gap-2">
                        <ShieldCheck size={16} />
                        Analysée / Traitée
                      </p>
                      <p className="text-[11px] text-blue-600 mt-1 uppercase tracking-widest font-bold">
                        Résultats d'analyses disponibles dans l'onglet Résultats
                      </p>
                    </div>
                    {p.laboratoryName && (
                      <div className="text-xs font-semibold text-blue-700 bg-blue-200/50 px-3 py-1.5 rounded-lg inline-block self-start mt-1">
                        Laboratoire: {p.laboratoryName}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-slate-400">
              Aucune ordonnance disponible.
            </div>
          )}
        </div>
      )}
      </div> {/* Fin wrapper print:hidden */}

      {/* ZONE D'IMPRESSION ORDONNANCE */}
      {selectedPrintPrescription && (
        <div className="hidden print:block printable-area bg-white z-[9999] p-10 text-black">
          <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider">{selectedPrintPrescription.hospitalName || "Hôpital Central"}</h1>
              <p className="text-sm text-slate-600">Service des Consultations Médicales</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase">Ordonnance</h2>
              <p className="text-sm font-bold mt-1">Date : {selectedPrintPrescription.consultationDate ? new Date(selectedPrintPrescription.consultationDate).toLocaleDateString('fr-FR') : 'Non datée'}</p>
            </div>
          </div>

          <div className="flex justify-between mb-12">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Médecin traitant</p>
              <p className="font-bold text-lg">Dr. {selectedPrintPrescription.doctorName}</p>
              <p className="text-sm text-slate-600">Spécialiste</p>
            </div>
            <div className="text-right border border-slate-300 p-4 rounded-xl min-w-[250px]">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Patient(e)</p>
              <p className="font-bold text-lg">{patientData ? `${patientData.firstName} ${patientData.lastName}` : 'Patient'}</p>
              <p className="text-sm text-slate-600">Dossier N° : {patientData?.uniqueNumber || patientData?.id || 'N/A'}</p>
            </div>
          </div>

          <div className="mb-12 min-h-[300px]">
            <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-6">
              Prescription ({selectedPrintPrescription.type === 'medication' ? 'Médicaments' : 'Examens & Analyses'})
            </h3>
            <p className="whitespace-pre-wrap text-base leading-relaxed">{selectedPrintPrescription.content}</p>

            {/* Détails de délivrance en pharmacie si délivrée */}
            {selectedPrintPrescription.status === 'delivered' && selectedPrintPrescription.sale?.items && selectedPrintPrescription.sale.items.length > 0 && (
              <div className="mt-8 border-2 border-emerald-600 rounded-xl p-4 bg-emerald-50/30">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-black text-emerald-900 uppercase tracking-wide">
                    Délivrance effectuée en Pharmacie
                  </h4>
                  <span className="text-xs font-bold text-emerald-800">
                    {selectedPrintPrescription.pharmacyName || selectedPrintPrescription.sale.pharmacyName || 'Pharmacie'} • Total : {selectedPrintPrescription.sale.totalAmount?.toLocaleString()} FCFA
                  </span>
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-300 text-slate-700 font-bold">
                      <th className="py-1.5 text-left">Médicament</th>
                      <th className="py-1.5 text-center w-12">Qté</th>
                      <th className="py-1.5 text-right w-20">P.U.</th>
                      <th className="py-1.5 text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-200">
                    {selectedPrintPrescription.sale.items.map((it: any, idx: number) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1">
                          <span className="font-bold text-slate-900">{it.name}</span>
                          {it.isSubstituted && (
                            <span className="block text-[10px] text-amber-800">
                              ↪ Substitué (init. {it.originalMedicineName || 'princeps'})
                            </span>
                          )}
                        </td>
                        <td className="py-1 text-center font-bold text-slate-800">{it.quantity}</td>
                        <td className="py-1 text-right text-slate-600">{Number(it.unitPrice || 0).toLocaleString()} F</td>
                        <td className="py-1 text-right font-black text-slate-900">{Number(it.total || 0).toLocaleString()} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 items-end border-t border-slate-300 pt-8 mt-auto">
            <div className="text-left overflow-hidden">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                {selectedPrintPrescription.type === 'lab' ? 'Code Examens & Analyses' : 'Code Pharmacie'}
              </p>
              <div className="transform origin-left scale-75 max-w-full">
                <Barcode 
                  value={selectedPrintPrescription.qrCode || selectedPrintPrescription.id} 
                  height={50} 
                  width={1.2} 
                  displayValue={true} 
                  fontSize={14} 
                  background="transparent" 
                  margin={0}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 max-w-[200px]">
                {selectedPrintPrescription.type === 'lab' 
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