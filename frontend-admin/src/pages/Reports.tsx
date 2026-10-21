import { useEffect, useState, useRef } from 'react';
import { BarChart3, TrendingUp, Users, Download, Calendar, MoreHorizontal, Loader2 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M';
  }
  return amount.toLocaleString('fr-FR');
};

export default function Reports() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    revenue: 0,
  });
  const [chartData, setChartData] = useState({
    serviceDistribution: [],
    monthlyActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const filter = (node: HTMLElement) => {
        if (node?.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') return false;
        return true;
      };

      const header = reportRef.current.querySelector('.print-header');
      if (header) {
        header.classList.remove('hidden');
        header.classList.add('block');
      }

      // Attendre un tout petit peu pour que le DOM se mette à jour
      await new Promise(resolve => setTimeout(resolve, 50));

      const dataUrl = await toPng(reportRef.current, { 
        quality: 1, 
        pixelRatio: 2,
        filter: filter as any,
        backgroundColor: '#f1f5f9'
      });
      
      if (header) {
        header.classList.add('hidden');
        header.classList.remove('block');
      }

      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (reportRef.current.clientHeight * pdfWidth) / reportRef.current.clientWidth;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('rapport_activite.pdf');
    } catch (error: any) {
      console.error("Erreur détaillée lors de l'export PDF:", error);
      alert(`Erreur lors de la génération du PDF: ${error?.message || "Erreur inconnue"}`);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, repRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/reports')
        ]);
        setStats({
          totalPatients: dashRes.data.totalPatients || 0,
          totalAppointments: dashRes.data.totalAppointments || 0,
          revenue: dashRes.data.totalRevenue || 0,
        });
        setChartData(repRes.data);
      } catch (error) {
        console.error("Failed to load reports", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayMonthlyActivity = filterMonth 
    ? chartData.monthlyActivity.slice(-1) 
    : chartData.monthlyActivity;

  return (
    <div className="animate-in fade-in duration-500" ref={reportRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8" data-html2canvas-ignore="true">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={28} />
            Rapports & Statistiques
          </h2>
          <p className="text-slate-500 mt-1">Analysez les performances et la santé financière de vos établissements.</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button 
            onClick={() => setFilterMonth(!filterMonth)}
            className={`flex items-center gap-2 border px-4 py-2.5 rounded-xl transition-colors shadow-sm font-medium ${
              filterMonth 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar size={18} className={filterMonth ? 'text-blue-600' : 'text-slate-400'} /> Ce mois-ci
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30 font-medium disabled:opacity-50"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
            {exporting ? 'Génération...' : 'Exporter (PDF)'}
          </button>
        </div>
      </div>

      {/* Header specifically for the PDF (hidden on screen) */}
      <div className="hidden print-header mb-8 pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-blue-600">Rapport d'Activité Médicale</h1>
        <p className="text-slate-500">Généré le {new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bento-card relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
              <Users className="text-blue-600" size={24} />
            </div>
            <p className="text-slate-500 font-medium mb-1">Patients totaux</p>
            <p className="text-4xl font-extrabold text-slate-900">{stats.totalPatients.toLocaleString('fr-FR')}</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 w-fit px-2.5 py-1 rounded-xl">
              <TrendingUp size={14} /> +12% ce mois
            </div>
          </div>
        </div>

        <div className="bento-card relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
            <p className="text-slate-500 font-medium mb-1">Rendez-vous (Ce mois)</p>
            <p className="text-4xl font-extrabold text-slate-900">{stats.totalAppointments}</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 w-fit px-2.5 py-1 rounded-xl">
              <TrendingUp size={14} /> +5% prévus
            </div>
          </div>
        </div>

        <div className="bento-card relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
              <BarChart3 className="text-amber-600" size={24} />
            </div>
            <p className="text-slate-500 font-medium mb-1">CA Total (FCFA)</p>
            <p className="text-4xl font-extrabold text-slate-900">{formatCurrency(stats.revenue)}</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 w-fit px-2.5 py-1 rounded-xl">
              <TrendingUp size={14} /> +22% ce mois
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bento-card col-span-1 lg:col-span-2 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-lg font-bold text-slate-900">Activité Mensuelle</h3>
              <button className="text-slate-400 hover:text-slate-600 transition-colors print:hidden">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <div className="h-[300px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayMonthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="consultations" name="Consultations" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="urgences" name="Urgences" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bento-card col-span-1 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-lg font-bold text-slate-900">Répartition par Service</h3>
              <button className="text-slate-400 hover:text-slate-600 transition-colors print:hidden">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <div className="h-[300px] w-full relative z-10 flex flex-col justify-center">
              {chartData.serviceDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.serviceDistribution}
                      cx="40%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.serviceDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Legend 
                      verticalAlign="middle" 
                      align="right" 
                      layout="vertical" 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-500">Aucune donnée disponible</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}