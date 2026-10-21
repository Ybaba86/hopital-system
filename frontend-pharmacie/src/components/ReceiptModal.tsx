import { Printer, X } from 'lucide-react';

export interface ReceiptModalProps {
  sale: any;
  onClose: () => void;
}

export default function ReceiptModal({ sale, onClose }: ReceiptModalProps) {
  if (!sale) return null;

  // Normalisation des données quelle que soit la source (nouvelle vente, liste des ventes, rapport ou historique patient)
  const baseSale = sale.sale || sale;
  const payment = baseSale.payment || sale.payment || {};
  const invoice = sale.invoice || {};

  const receiptNumber = 
    invoice.receiptNumber ||
    payment.receiptNumber || 
    baseSale.receiptNumber || 
    (baseSale.id ? `REC-${baseSale.id.slice(0, 8).toUpperCase()}` : 'REC-PHARM');

  const saleDate = baseSale.paymentDate || baseSale.createdAt || invoice.date || sale.paymentDate || new Date().toISOString();
  const formattedDate = new Date(saleDate).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const patient = baseSale.prescription?.consultation?.patient || sale.patient || null;
  const doctor = baseSale.prescription?.consultation?.doctor || null;

  const customerName = 
    invoice.customerName ||
    baseSale.customerName || 
    (patient ? `${patient.firstName} ${patient.lastName}` : 'Client Vente Libre');

  const customerPhone = 
    invoice.customerPhone || 
    baseSale.customerPhone || 
    patient?.phone || 
    '—';

  const doctorName = 
    invoice.doctorName || 
    (doctor ? `Dr. ${doctor.name}` : null) || 
    null;

  const prescriptionRef = 
    invoice.prescriptionQr || 
    baseSale.prescription?.qrCode || 
    baseSale.prescriptionId || 
    null;

  const isOverTheCounter = 
    baseSale.isOverTheCounter !== undefined 
      ? baseSale.isOverTheCounter 
      : (invoice.isOverTheCounter !== undefined ? invoice.isOverTheCounter : !prescriptionRef);

  // Normaliser les items
  const rawItems = baseSale.items || invoice.items || [];
  const items = rawItems.map((item: any) => {
    const medName = item.medicine?.name || item.medicine || item.name || 'Médicament';
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice || item.price || (item.total ? item.total / qty : 0));
    const total = Number(item.total || qty * price);
    return {
      name: medName,
      quantity: qty,
      unitPrice: price,
      total,
      isSubstituted: Boolean(item.isSubstituted),
      originalMedicineName: item.originalMedicineName || null
    };
  });

  const totalAmount = Number(baseSale.totalAmount ?? invoice.totalAmount ?? sale.amount ?? 0);
  const discount = Number(baseSale.discount ?? invoice.discount ?? 0);
  const subtotal = Number(baseSale.subtotal ?? invoice.subtotal ?? (totalAmount + discount));

  const paymentTypeKey = payment.paymentType || baseSale.paymentType || invoice.paymentType || sale.paymentType || 'cash';
  const paymentLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte Bancaire',
    orange_money: 'Orange Money',
    wave: 'Wave',
    insurance: 'Prise en charge / Assurance',
  };
  const paymentMethodLabel = paymentLabels[paymentTypeKey] || paymentTypeKey;

  const isCancelled = baseSale.status === 'cancelled' || sale.status === 'cancelled';

  const storedPharmacien = JSON.parse(localStorage.getItem('pharmacien') || 'null');
  const pharmacistName = storedPharmacien?.name || 'Pharmacien Officine';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      
      {/* Container de la fenêtre */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[96vh]">
        
        {/* Barre d'action supérieure (NON imprimable) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="text-emerald-400 w-5 h-5" />
            <span className="font-bold text-sm sm:text-base">Aperçu Facture / Ticket Pharmacie</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Printer size={16} />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Zone de prévisualisation avec ascenseur pour écran (NON scrollable en print) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          
          {/* ================= ZONE STRICTEMENT IMPRIMABLE ================= */}
          <div className="printable-area bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 text-slate-900 max-w-xl mx-auto shadow-sm">
            
            {/* Bannière en-tête */}
            <div className="text-center pb-5 border-b-2 border-slate-800 border-dashed">
              <div className="inline-flex items-center justify-center gap-2 mb-1">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  GRANDE PHARMACIE HOSPITALIÈRE
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Hôpital National Universitaire • Service de Pharmacie & Officine</p>
              <p className="text-xs text-slate-500 mt-0.5">Dakar, Sénégal • Tél: +221 33 800 00 00 / 77 123 45 67</p>
              
              <div className="mt-3 inline-block bg-slate-100 text-slate-800 font-black text-xs sm:text-sm px-4 py-1 rounded-full uppercase tracking-wider border border-slate-300">
                {isOverTheCounter ? 'TICKET VENTE LIBRE' : 'TICKET DÉLIVRANCE ORDONNANCE'}
              </div>
            </div>

            {/* Alerte si annulée */}
            {isCancelled && (
              <div className="mt-4 p-2.5 bg-red-50 text-red-700 text-center font-black text-xs uppercase tracking-widest border border-red-300 rounded-lg">
                ⚠️ Vente Annulée - Stocks Réintégrés
              </div>
            )}

            {/* Infos Reçu & Dates */}
            <div className="grid grid-cols-2 gap-3 py-4 text-xs border-b border-slate-200">
              <div>
                <p className="text-slate-500 font-semibold">N° Reçu / Facture :</p>
                <p className="font-mono font-black text-slate-900 text-sm">{receiptNumber}</p>
                <p className="text-slate-500 font-semibold mt-1">Date & Heure :</p>
                <p className="font-medium text-slate-800">{formattedDate}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 font-semibold">Mode de Vente :</p>
                <p className="font-bold text-slate-900">{isOverTheCounter ? 'Vente au comptoir' : 'Sur ordonnance'}</p>
                {prescriptionRef && (
                  <>
                    <p className="text-slate-500 font-semibold mt-1">Réf. Ordonnance :</p>
                    <p className="font-mono font-bold text-emerald-800 text-xs truncate">{prescriptionRef}</p>
                  </>
                )}
              </div>
            </div>

            {/* Infos Client & Médecin */}
            <div className="py-3 text-xs border-b border-slate-200 space-y-1 bg-slate-50/70 p-3 rounded-xl mt-3">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Client / Patient :</span>
                <span className="font-bold text-slate-900 text-right">{customerName}</span>
              </div>
              {customerPhone && customerPhone !== '—' && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Téléphone :</span>
                  <span className="font-medium text-slate-700 text-right">{customerPhone}</span>
                </div>
              )}
              {patient?.uniqueNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Dossier Patient N° :</span>
                  <span className="font-mono font-bold text-slate-800 text-right">{patient.uniqueNumber}</span>
                </div>
              )}
              {doctorName && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Médecin Prescripteur :</span>
                  <span className="font-bold text-emerald-900 text-right">{doctorName}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500 font-semibold">Délivré par :</span>
                <span className="font-medium text-slate-800 text-right">{pharmacistName}</span>
              </div>
            </div>

            {/* Tableau des médicaments */}
            <div className="mt-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-slate-700 font-black uppercase text-[11px]">
                    <th className="py-2 text-left">Désignation</th>
                    <th className="py-2 text-center w-12">Qté</th>
                    <th className="py-2 text-right w-20">P.U.</th>
                    <th className="py-2 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item: any, index: number) => (
                    <tr key={index} className="py-2">
                      <td className="py-2 pr-2">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.isSubstituted && (
                          <div className="text-[10px] text-amber-800 font-bold flex items-center gap-1 mt-0.5">
                            <span>↪ Substitué (init. {item.originalMedicineName || 'médicament princeps'})</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-center font-bold text-slate-800">{item.quantity}</td>
                      <td className="py-2 text-right text-slate-600">{item.unitPrice.toLocaleString()}</td>
                      <td className="py-2 text-right font-black text-slate-900">{item.total.toLocaleString()} F</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                        Aucun médicament détaillé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totaux & Règlement */}
            <div className="mt-4 pt-3 border-t-2 border-slate-800 border-dashed text-xs space-y-1.5">
              {discount > 0 && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total brut :</span>
                    <span className="font-medium">{subtotal.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Remise commerciale accordée :</span>
                    <span>- {discount.toLocaleString()} FCFA</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-baseline pt-1 text-sm sm:text-base font-black border-t border-slate-200">
                <span className="text-slate-900 uppercase">NET PAYÉ (TTC) :</span>
                <span className="text-slate-900 text-lg sm:text-xl font-black">
                  {totalAmount.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Mode de règlement :</span>
                <span className="font-bold uppercase text-slate-800">{paymentMethodLabel}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Statut du paiement :</span>
                <span className={`font-black ${isCancelled ? 'text-red-600' : 'text-emerald-700'}`}>
                  {isCancelled ? 'ANNULÉ' : 'ACQUITTÉ / PAYÉ'}
                </span>
              </div>
            </div>

            {/* Pied de page & Mentions légales */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">⚠️ Les médicaments délivrés ne sont ni repris, ni échangés.</p>
              <p>Merci pour votre confiance. Prenez soin de votre santé.</p>
              <div className="pt-4 flex justify-between items-end text-[9px] text-slate-400">
                <span>Logiciel Médical & Officine Hôpital</span>
                <div className="border border-slate-300 rounded px-3 py-1 text-slate-400 text-center uppercase tracking-widest text-[8px]">
                  Cachet & Signature Pharmacie
                </div>
              </div>
            </div>

          </div>
          {/* ================= FIN ZONE IMPRIMABLE ================= */}

        </div>

        {/* Barre d'action inférieure (NON imprimable) */}
        <div className="no-print bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            💡 Astuce : Cliquez sur <strong>Imprimer</strong> pour sortir le ticket ou enregistrer en PDF.
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer size={16} />
              Imprimer Facture
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
