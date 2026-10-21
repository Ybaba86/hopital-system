import { useEffect, useState } from 'react';
import { Filter, FileText, Loader2, DollarSign, Wallet, CreditCard, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReceiptModal from '../components/ReceiptModal';

export default function MouvementsPharmacie() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [intervalType, setIntervalType] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchMotif, setSearchMotif] = useState('');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<any>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let start = new Date();
      let end = new Date();

      if (intervalType === 'today') {
        // already set to today
      } else if (intervalType === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
      } else if (intervalType === 'month') {
        start.setDate(1);
      } else if (intervalType === 'semester') {
        const currentMonth = start.getMonth();
        if (currentMonth < 6) {
          start.setMonth(0);
          start.setDate(1);
        } else {
          start.setMonth(6);
          start.setDate(1);
        }
      } else if (intervalType === 'year') {
        start.setMonth(0);
        start.setDate(1);
      } else if (intervalType === 'custom') {
        if (!customStart || !customEnd) {
          toast.error("Veuillez sélectionner les deux dates.");
          setLoading(false);
          return;
        }
        start = new Date(customStart);
        end = new Date(customEnd);
      }

      const formattedStart = start.toISOString().split('T')[0];
      const formattedEnd = end.toISOString().split('T')[0];

      const res = await api.get(`/sales/report/interval?startDate=${formattedStart}&endDate=${formattedEnd}`);
      setReport(res.data);
    } catch (error) {
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (intervalType !== 'custom') {
      fetchReport();
    }
  }, [intervalType]);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport();
  };

  const paymentTypeColors: Record<string, string> = {
    cash: 'bg-emerald-100 text-emerald-700',
    card: 'bg-blue-100 text-blue-700',
    orange_money: 'bg-orange-100 text-orange-700',
    wave: 'bg-cyan-100 text-cyan-700',
    insurance: 'bg-purple-100 text-purple-700',
  };

  const paymentTypeLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte Bancaire',
    orange_money: 'Orange Money',
    wave: 'Wave',
    insurance: 'Assurance',
  };

  const filteredPayments = report ? report.payments.filter((p: any) => {
    if (!searchMotif) return true;
    const meds = p.sale?.items?.map((i: any) => `${i.quantity}x ${i.medicine?.name}`).join(', ') || '';
    return meds.toLowerCase().includes(searchMotif.toLowerCase());
  }) : [];

  const exportPDF = () => {
    if (!report || filteredPayments.length === 0) {
      toast.error("Aucune donnée à exporter.");
      return;
    }

    const user = JSON.parse(localStorage.getItem('pharmacien') || '{}');
    const structureName = user.pharmacyName || 'Pharmacie';
    
    const filteredTotal = filteredPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const formatMoney = (val: number) => val.toLocaleString('fr-FR').replace(/\s/g, ' ').replace(/\u202F/g, ' ') + ' FCFA';
    const totalAmountStr = formatMoney(filteredTotal);

    const doc = new jsPDF();
    
    // Header title
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Rapport des Ventes", 14, 25);
    
    // Subtext
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(structureName, 14, 32);
    doc.text(`Période : Du ${new Date(report.startDate).toLocaleDateString('fr-FR')} au ${new Date(report.endDate).toLocaleDateString('fr-FR')}`, 14, 38);
    
    // Total block (rounded rectangle)
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(14, 44, 182, 14, 3, 3, "F");
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Total des recettes : ${totalAmountStr}`, 20, 53);

    const tableColumn = ["N° Reçu", "Date", "Patient", "Médicaments", "Type", "Montant"];
    const tableRows: any[] = [];

    filteredPayments.forEach((p: any) => {
      const patient = p.patient ? `${p.patient.firstName} ${p.patient.lastName}` : '—';
      const type = paymentTypeLabels[p.paymentType] || p.paymentType;
      const date = new Date(p.paymentDate).toLocaleString('fr-FR');
      const amount = formatMoney(p.amount);
      
      const meds = p.sale?.items?.map((i: any) => `${i.quantity}x ${i.medicine?.name}`).join(', ') || '—';

      tableRows.push([p.receiptNumber, date, patient, meds, type, amount]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      foot: [
        ["", "", "", "", "TOTAL GÉNÉRAL", totalAmountStr]
      ],
      startY: 65,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' }, // slate-800
      footStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' }, // emerald-600
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
      columnStyles: {
        5: { halign: 'right' } // Align Montant to right
      }
    });

    doc.save(`rapport_pharmacie_${report.startDate.split('T')[0]}.pdf`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0 gap-4 animate-fade-in">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-black text-slate-800">Mouvements & Rapports</h1>
        <p className="text-slate-500 mt-2 font-medium">Consultez et filtrez les recettes de votre pharmacie</p>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          
          <div className="flex gap-2 bg-slate-100 p-2 rounded-2xl overflow-x-auto w-full md:w-auto">
            {[
              { id: 'today', label: "Aujourd'hui" },
              { id: 'week', label: "Cette semaine" },
              { id: 'month', label: "Ce mois" },
              { id: 'semester', label: "Ce semestre" },
              { id: 'year', label: "Cette année" },
              { id: 'custom', label: "Personnalisé" },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setIntervalType(btn.id)}
                className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${intervalType === btn.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {intervalType === 'custom' && (
            <form onSubmit={handleCustomSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center w-full md:w-auto">
              <input 
                type="date" 
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="p-2.5 sm:p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                required
              />
              <span className="hidden sm:inline text-slate-400">→</span>
              <input 
                type="date" 
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="p-2.5 sm:p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                required
              />
              <button 
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 sm:p-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
              >
                <Filter size={18} />
                <span className="sm:hidden">Filtrer</span>
              </button>
            </form>
          )}

        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-emerald-600" size={48} />
          <p className="text-slate-500 font-medium">Calcul des recettes...</p>
        </div>
      ) : report ? (
        <div className="gap-4 animate-fade-in flex-1 flex flex-col min-h-0">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
            <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden md:col-span-1">
              <div className="absolute top-0 right-0 p-8 opacity-10"><DollarSign size={100} /></div>
              <h3 className="text-emerald-100 font-bold mb-2">Total Filtré</h3>
              <p className="text-4xl font-black">{filteredPayments.reduce((s: number, p: any) => s + p.amount, 0).toLocaleString()} FCFA</p>
              <p className="text-sm text-emerald-200 mt-4">
                Du {new Date(report.startDate).toLocaleDateString('fr-FR')} au {new Date(report.endDate).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-500 text-sm font-bold flex items-center gap-2"><Wallet size={16} /> Espèces</p>
                <p className="text-2xl font-black text-slate-800 mt-2">{report.byType.cash.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold flex items-center gap-2"><CreditCard size={16} /> Carte Bancaire</p>
                <p className="text-2xl font-black text-slate-800 mt-2">{report.byType.card.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold flex items-center gap-2 text-orange-500">Orange Money</p>
                <p className="text-2xl font-black text-slate-800 mt-2">{report.byType.orange_money.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold flex items-center gap-2 text-cyan-500">Wave</p>
                <p className="text-2xl font-black text-slate-800 mt-2">{report.byType.wave.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-lg text-slate-800">Détail des Ventes ({filteredPayments.length})</h3>
              <button onClick={exportPDF} className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors">
                <FileText size={18} />
                Exporter PDF
              </button>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse relative min-w-[680px]">
                <thead className="bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3 align-top">N° Reçu</th>
                    <th className="px-6 py-3 align-top">Date</th>
                    <th className="px-6 py-3 align-top">Patient</th>
                    <th className="px-6 py-3 align-top">
                      <div className="flex flex-col gap-2">
                        <span>Détail Médicaments</span>
                        <input 
                          type="text" 
                          placeholder="Filtrer médicaments..." 
                          value={searchMotif} 
                          onChange={(e) => setSearchMotif(e.target.value)}
                          className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-normal bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-full max-w-[150px]"
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 align-top">Type</th>
                    <th className="px-6 py-3 text-right align-top">Montant</th>
                    <th className="px-6 py-3 text-center align-top">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3 font-mono text-sm text-slate-600 font-bold">{p.receiptNumber}</td>
                      <td className="px-6 py-3 text-sm text-slate-500">
                        {new Date(p.paymentDate).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {p.patient ? `${p.patient.firstName} ${p.patient.lastName}` : '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">
                        {p.sale?.items?.map((item: any) => (
                          <div key={item.id} className="flex gap-2">
                            <span className="font-bold text-emerald-600">{item.quantity}x</span>
                            <span>{item.medicine?.name}</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${paymentTypeColors[p.paymentType] || 'bg-slate-100 text-slate-600'}`}>
                          {paymentTypeLabels[p.paymentType] || p.paymentType}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-black text-slate-800">
                        {p.amount.toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => setSelectedSaleForReceipt({
                            ...p.sale,
                            payment: p,
                            patient: p.patient,
                            totalAmount: p.amount,
                            paymentType: p.paymentType
                          })}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Imprimer / Réimprimer la facture"
                        >
                          <Printer size={13} />
                          <span>Reçu</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                        Aucun mouvement trouvé pour cette période ou ce filtre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : null}

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
