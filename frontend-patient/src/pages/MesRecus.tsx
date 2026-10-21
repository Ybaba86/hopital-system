import { useState, useEffect } from 'react';
import { Receipt, Download, FileText, Loader2, Hospital, Printer, Pill } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

export default function MesRecus() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const storedPatient = localStorage.getItem('patient');
        if (!storedPatient) return;
        const patient = JSON.parse(storedPatient);
        setPatientData(patient);

        const res = await api.get(`/payments?patientId=${patient.id}`);
        setPayments(res.data);
      } catch (error) {
        console.error("Erreur chargement paiements:", error);
        toast.error("Impossible de charger vos reçus de paiement");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const getPaymentMethodLabel = (method: string) => {
    switch(method) {
      case 'cash': return 'Espèces';
      case 'card': return 'Carte Bancaire';
      case 'orange_money': return 'Orange Money';
      case 'wave': return 'Wave';
      case 'insurance': return 'Assurance';
      default: return method;
    }
  };

  const handlePrint = (payment: any) => {
    setSelectedReceipt(payment);
    const originalTitle = document.title;
    const dateStr = new Date(payment.paymentDate).toISOString().split('T')[0];
    const receiptType = payment.sale ? 'Pharmacie' : 'Consultation';
    document.title = `Reçu_${receiptType}_${dateStr}`;
    
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 150);
  };

  const downloadReceiptPDF = (payment: any) => {
    try {
      const doc = new jsPDF();
      const dateStr = new Date(payment.paymentDate).toISOString().split('T')[0];
      const receiptType = payment.sale ? 'Pharmacie' : 'Consultation';

      // En-tête Hôpital
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text(patientData?.hospitalName || "HÔPITAL & OFFICINE MÉDICALE", 20, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(payment.sale ? "Reçu Officiel d'Achat Pharmacie" : "Reçu de Paiement Consultation & Actes", 20, 29);
      doc.text(`Reçu N° : ${payment.receiptNumber}`, 135, 22);
      doc.text(`Date : ${new Date(payment.paymentDate).toLocaleDateString('fr-FR')}`, 135, 29);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);

      // Informations Patient
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(`Patient : ${patientData?.firstName || ''} ${patientData?.lastName || ''}`, 20, 45);
      if (patientData?.uniqueNumber) {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Dossier N° : ${patientData.uniqueNumber}`, 20, 52);
      }

      let yPos = 65;

      // Détail de la vente en pharmacie ou de la consultation
      if (payment.sale?.items && payment.sale.items.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`Détail des Médicaments Délivrés (${payment.sale.pharmacy?.name || 'Pharmacie'}) :`, 20, yPos);
        yPos += 7;

        // Entête tableau
        doc.setFillColor(241, 245, 249);
        doc.rect(20, yPos, 170, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text("Désignation", 24, yPos + 5.5);
        doc.text("Qté", 115, yPos + 5.5);
        doc.text("P.U. (FCFA)", 135, yPos + 5.5);
        doc.text("Total (FCFA)", 165, yPos + 5.5);
        yPos += 12;

        payment.sale.items.forEach((item: any) => {
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
          const medName = item.medicine?.name || item.name || 'Médicament';
          doc.text(medName, 24, yPos);
          doc.text(String(item.quantity || 1), 118, yPos);
          doc.text(Number(item.unitPrice || 0).toLocaleString(), 138, yPos);
          doc.text(Number(item.total || 0).toLocaleString(), 168, yPos);
          yPos += 6;

          if (item.isSubstituted) {
            doc.setFontSize(8);
            doc.setTextColor(180, 83, 9);
            doc.text(`↪ Substitué (remplace: ${item.originalMedicineName || 'médicament princeps'})`, 28, yPos);
            yPos += 5;
          }
        });

        yPos += 5;
      } else {
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("Désignation du Paiement :", 20, yPos);
        yPos += 7;

        doc.setFillColor(241, 245, 249);
        doc.rect(20, yPos, 170, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text("Prestation / Motif", 24, yPos + 5.5);
        doc.text("Montant (FCFA)", 160, yPos + 5.5);
        yPos += 12;

        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(payment.description || 'Consultation médicale', 24, yPos);
        doc.text(Number(payment.amount || 0).toLocaleString(), 165, yPos);
        yPos += 12;
      }

      // Trait de séparation
      doc.setDrawColor(203, 213, 225);
      doc.line(20, yPos, 190, yPos);
      yPos += 10;

      // Règlement & Net Payé
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Mode de paiement : ${getPaymentMethodLabel(payment.paymentType)}`, 20, yPos);
      
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`Total Payé : ${payment.amount.toLocaleString()} FCFA`, 125, yPos);

      // Bas de page
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Ce document tient lieu de reçu officiel de paiement.", 105, 275, { align: "center" });
      if (payment.sale) {
        doc.text("Les médicaments délivrés ne sont ni repris, ni échangés.", 105, 280, { align: "center" });
      }

      // Sauvegarde du fichier avec le nom exact Reçu_...
      doc.save(`Reçu_${receiptType}_${dateStr}.pdf`);
      toast.success('Reçu PDF téléchargé avec succès !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="text-slate-500 font-medium">Récupération de vos reçus...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 print:p-0">
      
      {/* HEADER DE LA PAGE (Masqué à l'impression) */}
      <header className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-3xl p-8 shadow-lg flex items-center gap-4 print:hidden">
        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
          <Receipt size={40} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black mb-2">Mes Reçus de Paiement</h1>
          <p className="text-teal-100">Consultez et téléchargez vos reçus (PDF) pour vos remboursements et la pharmacie.</p>
        </div>
      </header>

      {/* LISTE DES REÇUS */}
      <div className={`print:hidden ${selectedReceipt ? 'hidden md:block' : ''}`}>
        {payments.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Receipt className="text-slate-300" size={40} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Aucun reçu trouvé</h2>
            <p className="text-slate-500">Vous n'avez pas encore effectué de paiement enregistré.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payments.map((payment) => (
              <div key={payment.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`${payment.sale ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700'} p-2 rounded-xl`}>
                      {payment.sale ? <Pill size={24} /> : <FileText size={24} />}
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 text-xs font-bold rounded-lg font-mono">
                      {payment.receiptNumber}
                    </span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <p className="text-sm text-slate-500 font-medium">
                      {new Date(payment.paymentDate).toLocaleDateString('fr-FR')} à {new Date(payment.paymentDate).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <p className="text-base font-bold text-slate-800">{payment.description}</p>
                    {payment.sale?.pharmacy?.name && (
                      <p className="text-xs text-emerald-700 font-semibold">
                        Pharmacie : {payment.sale.pharmacy.name}
                      </p>
                    )}
                  </div>

                  {/* Détail des médicaments achetés si vente en pharmacie */}
                  {payment.sale?.items && payment.sale.items.length > 0 && (
                    <div className="mb-4 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-xs">
                      <p className="font-black text-emerald-900 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                        <Pill size={12} className="text-emerald-700" />
                        Médicaments achetés ({payment.sale.items.length}) :
                      </p>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {payment.sale.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-start text-slate-700 border-b border-emerald-100/60 pb-1 last:border-0 last:pb-0">
                            <span className="font-medium pr-1">
                              {item.quantity}x {item.medicine?.name || item.name}
                              {item.isSubstituted && (
                                <span className="block text-[10px] text-amber-700 font-semibold">
                                  ↪ Substitué (init. {item.originalMedicineName || 'princeps'})
                                </span>
                              )}
                            </span>
                            <span className="font-bold shrink-0">{Number(item.total || 0).toLocaleString()} F</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Montant payé</p>
                    <p className="text-xl sm:text-2xl font-black text-teal-600">
                      {payment.amount === 0 ? '0 F' : `${payment.amount.toLocaleString()} FCFA`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => downloadReceiptPDF(payment)}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-700 p-2.5 rounded-xl transition-colors cursor-pointer"
                      title="Télécharger Reçu PDF (Reçu_...)"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      onClick={() => handlePrint(payment)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-colors cursor-pointer"
                      title="Imprimer Reçu"
                    >
                      <Printer size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ZONE D'IMPRESSION (Visible uniquement lors du window.print()) */}
      {selectedReceipt && (
        <div className="hidden print:block printable-area bg-white p-8 absolute inset-0 text-black">
          {/* En-tête Hôpital / Officine */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-6 mb-8">
            <div className="flex items-center gap-4">
              <Hospital size={48} className="text-slate-800" />
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider">{patientData?.hospitalName || 'HÔPITAL ET PHARMACIE CENTRALE'}</h1>
                <p className="text-sm text-slate-600">
                  {selectedReceipt.sale ? "Reçu de délivrance & paiement en pharmacie" : "Reçu de paiement officiel des actes médicaux"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg font-mono">{selectedReceipt.receiptNumber}</p>
              <p className="text-sm">Date : {new Date(selectedReceipt.paymentDate).toLocaleDateString('fr-FR')}</p>
              <p className="text-sm">Heure : {new Date(selectedReceipt.paymentDate).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>

          {/* Informations Patient */}
          <div className="bg-slate-100 p-6 rounded-xl mb-8">
            <h2 className="text-sm font-bold uppercase text-slate-500 mb-4 tracking-widest border-b border-slate-300 pb-2">Informations Patient</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Nom complet</p>
                <p className="font-bold text-lg">{patientData?.firstName} {patientData?.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Numéro de dossier</p>
                <p className="font-bold text-lg">{patientData?.uniqueNumber || patientData?.id || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Détails du Paiement & Contenu de la Vente */}
          <div className="mb-12">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-xs uppercase font-bold text-slate-700">
                  <th className="py-2.5">Désignation</th>
                  {selectedReceipt.sale?.items && <th className="py-2.5 text-center w-16">Qté</th>}
                  {selectedReceipt.sale?.items && <th className="py-2.5 text-right w-24">P.U.</th>}
                  <th className="py-2.5 text-right w-28">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedReceipt.sale?.items && selectedReceipt.sale.items.length > 0 ? (
                  selectedReceipt.sale.items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-200 text-sm">
                      <td className="py-3">
                        <div className="font-bold text-slate-900">{item.medicine?.name || item.name}</div>
                        {item.isSubstituted && (
                          <div className="text-[11px] text-amber-800 font-semibold">
                            ↪ Substitué (init. {item.originalMedicineName || 'princeps'})
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-600">{Number(item.unitPrice || 0).toLocaleString()} F</td>
                      <td className="py-3 text-right font-black text-slate-900">{Number(item.total || 0).toLocaleString()} F</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-slate-200">
                    <td className="py-4 text-base font-medium">{selectedReceipt.description}</td>
                    <td className="py-4 text-base font-bold text-right">
                      {selectedReceipt.amount === 0 ? '0 F' : `${selectedReceipt.amount.toLocaleString()} FCFA`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totaux & Moyen de paiement */}
          <div className="flex justify-between items-start border-t-2 border-slate-800 pt-6">
            <div>
              <p className="text-sm font-bold text-slate-600 mb-1">Moyen de paiement :</p>
              <p className="text-lg font-medium">{getPaymentMethodLabel(selectedReceipt.paymentType)}</p>
              
              <div className="mt-8 border-t border-slate-300 pt-4 w-64">
                <p className="text-sm text-center text-slate-500">Signature / Cachet Caisse & Pharmacie</p>
                <div className="h-20"></div>
              </div>
            </div>
            <div className="text-right bg-slate-100 p-6 rounded-xl">
              <p className="text-sm font-bold uppercase text-slate-500 mb-2 tracking-widest">Total Payé</p>
              <p className="text-4xl font-black">
                {selectedReceipt.amount === 0 ? '0 F' : `${selectedReceipt.amount.toLocaleString()} FCFA`}
              </p>
            </div>
          </div>

          <div className="mt-16 text-center text-xs text-slate-400">
            <p>Ce reçu est généré électroniquement et tient lieu de justificatif de paiement.</p>
            {selectedReceipt.sale && <p>Les médicaments délivrés ne sont ni repris, ni échangés.</p>}
            <p>{patientData?.hospitalName || 'Hôpital'} - www.hopital-sante.test - Contact : +221 33 000 00 00</p>
          </div>
        </div>
      )}
    </div>
  );
}
