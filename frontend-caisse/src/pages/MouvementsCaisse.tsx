import { useEffect, useState } from 'react';
import { Filter, FileText, Loader2, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function MouvementsCaisse() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [intervalType, setIntervalType] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      let start = new Date();
      let end = new Date();

      if (intervalType === 'today') {
        // already set to today
      } else if (intervalType === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
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

      const user = JSON.parse(localStorage.getItem('caissier') || '{}');
      const hospitalId = user.hospitalId || '';

      const res = await api.get(`/payments/report?startDate=${formattedStart}&endDate=${formattedEnd}&hospitalId=${hospitalId}`);
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
    if (!globalSearch) return true;
    const term = globalSearch.toLowerCase();
    const patientName = p.patient ? `${p.patient.firstName} ${p.patient.lastName}`.toLowerCase() : '';
    const desc = (p.description || '').toLowerCase();
    const receipt = (p.receiptNumber || '').toLowerCase();
    return patientName.includes(term) || desc.includes(term) || receipt.includes(term);
  }) : [];

  const exportPDF = () => {
    if (!report || filteredPayments.length === 0) {
      toast.error("Aucune donnée à exporter.");
      return;
    }

    const user = JSON.parse(localStorage.getItem('caissier') || '{}');
    const structureName = user.hospitalName || 'Hôpital / Clinique';
    
    const filteredTotal = filteredPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const formatMoney = (val: number) => val.toLocaleString('fr-FR').replace(/\s/g, ' ').replace(/\u202F/g, ' ') + ' FCFA';
    const totalAmountStr = formatMoney(filteredTotal);

    const doc = new jsPDF();
    
    // Header title
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Rapport des Mouvements", 14, 25);
    
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

    const tableColumn = ["N° Reçu", "Date", "Patient", "Motif", "Type", "Montant"];
    const tableRows: any[] = [];

    filteredPayments.forEach((p: any) => {
      const patient = p.patient ? `${p.patient.firstName} ${p.patient.lastName}` : '—';
      const type = paymentTypeLabels[p.paymentType] || p.paymentType;
      const date = new Date(p.paymentDate).toLocaleString('fr-FR');
      const amount = formatMoney(p.amount);
      
      tableRows.push([p.receiptNumber, date, patient, p.description, type, amount]);
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

    doc.save(`rapport_caisse_${report.startDate.split('T')[0]}.pdf`);
  };

  return (
    <div className="p-2 sm:p-4 w-full mx-auto flex-1 flex flex-col min-h-0 gap-4">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-black text-slate-800">Mouvements & Rapports</h1>
        <p className="text-slate-500 mt-2 font-medium">Consultez et filtrez les recettes de la caisse</p>
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
        <div className="animate-fade-in flex flex-col flex-1 min-h-0 gap-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
            <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign size={64} /></div>
              <h3 className="text-emerald-100 font-bold mb-1 text-base">Total Filtré</h3>
              <p className="text-3xl font-black">{filteredPayments.reduce((s: number, p: any) => s + p.amount, 0).toLocaleString()} FCFA</p>
              <p className="text-xs text-emerald-200 mt-2">
                Du {new Date(report.startDate).toLocaleDateString('fr-FR')} au {new Date(report.endDate).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-sm font-bold">Espèces</p>
                <p className="text-xl font-black text-slate-800 mt-1">{report.byType.cash.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold">Carte Bancaire</p>
                <p className="text-xl font-black text-slate-800 mt-1">{report.byType.card.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold text-orange-500">Orange Money</p>
                <p className="text-xl font-black text-slate-800 mt-1">{report.byType.orange_money.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold text-cyan-500">Wave</p>
                <p className="text-xl font-black text-slate-800 mt-1">{report.byType.wave.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-lg text-slate-800 flex-shrink-0">Détail des Transactions ({filteredPayments.length})</h3>
              
              <div className="flex w-full md:w-auto items-center gap-4">
                <input 
                  type="text" 
                  placeholder="Rechercher patient, motif, N°..." 
                  value={globalSearch} 
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64"
                />
                <button onClick={exportPDF} className="flex-shrink-0 flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors">
                  <FileText size={18} />
                  Exporter PDF
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse relative min-w-[650px]">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm text-slate-500 text-sm uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3 align-top">N° Reçu</th>
                    <th className="px-6 py-3 align-top">Date</th>
                    <th className="px-6 py-3 align-top">Patient</th>
                    <th className="px-6 py-3 align-top">Motif</th>
                    <th className="px-6 py-3 align-top">Type</th>
                    <th className="px-6 py-3 text-right align-top">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group text-base">
                      <td className="px-6 py-3 font-mono text-slate-600 font-bold">{p.receiptNumber}</td>
                      <td className="px-6 py-3 text-slate-500">
                        {new Date(p.paymentDate).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {p.patient ? `${p.patient.firstName} ${p.patient.lastName}` : '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {p.description}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-bold ${paymentTypeColors[p.paymentType] || 'bg-slate-100 text-slate-600'}`}>
                          {paymentTypeLabels[p.paymentType] || p.paymentType}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-black text-slate-800 text-lg">
                        {p.amount.toLocaleString()} FCFA
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
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
    </div>
  );
}
