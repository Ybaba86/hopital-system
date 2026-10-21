import { useEffect, useState } from 'react';
import { PackageSearch, TrendingUp, AlertTriangle, FileText, Printer } from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import ReceiptModal from '../components/ReceiptModal';

export default function DashboardPharmacie() {
  const [stats, setStats] = useState({
    totalMeds: 0,
    lowStock: 0,
    totalSales: 0,
    salesAmount: 0
  });

  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [medRes, saleRes] = await Promise.all([
          api.get('/medicines'),
          api.get('/sales')
        ]);
        
        const meds = medRes.data;
        const sales = saleRes.data;

        // Calcul des stats des ventes du jour (hors ventes annulées)
        const today = new Date().toISOString().slice(0, 10);
        const todaySales = sales.filter((s: any) => s.paymentDate.startsWith(today) && s.status !== 'cancelled');
        const todayAmount = todaySales.reduce((acc: number, s: any) => acc + s.totalAmount, 0);

        setStats({
          totalMeds: meds.length,
          lowStock: meds.filter((m: any) => m.stock < 20).length,
          totalSales: todaySales.length,
          salesAmount: todayAmount
        });

        setRecentSales(sales.slice(0, 5)); // 5 dernières ventes
      } catch (error) {
        console.error("Erreur de chargement", error);
      }
    };
    fetchStats();
  }, []);

  const handleCancelSale = async (saleId: string) => {
    if (!window.confirm("Voulez-vous vraiment annuler cette vente ? Les stocks seront recrédités.")) return;
    try {
      await api.put(`/sales/${saleId}/cancel`);
      alert("Vente annulée avec succès");
      
      // Mettre à jour l'état local pour refléter l'annulation
      setRecentSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'cancelled' } : s));
      
      // Re-fetch les stats complètes pour actualiser le chiffre d'affaires
      const saleRes = await api.get('/sales');
      const sales = saleRes.data;
      const today = new Date().toISOString().slice(0, 10);
      const todaySales = sales.filter((s: any) => s.paymentDate.startsWith(today) && s.status !== 'cancelled');
      const todayAmount = todaySales.reduce((acc: number, s: any) => acc + s.totalAmount, 0);
      setStats(prev => ({ ...prev, totalSales: todaySales.length, salesAmount: todayAmount }));
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de l'annulation");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Tableau de bord Pharmacie</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1 sm:mt-2 font-medium">Aperçu général des stocks et des ventes de l'officine</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-2xl text-green-600">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Ventes du jour</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.totalSales} <span className="text-sm font-bold text-slate-400">ordonnances</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-2xl text-blue-600">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Chiffre d'Affaires</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.salesAmount.toLocaleString()} <span className="text-sm font-bold text-slate-400">FCFA</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600">
            <PackageSearch size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Total Références</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.totalMeds}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-red-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="bg-red-100 p-4 rounded-2xl text-red-600 relative z-10">
            <AlertTriangle size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-red-400 uppercase">Stock critique (&lt; 20)</p>
            <h3 className="text-2xl font-black text-red-600">{stats.lowStock} <span className="text-sm font-bold text-red-400">médicaments</span></h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Dernières Ventes</h3>
            <Link to="/scanner" className="text-sm font-bold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">Nouvelle Vente</Link>
          </div>
          
          <div className="space-y-4">
            {recentSales.map(sale => (
              <div key={sale.id} className={`flex justify-between items-center p-4 rounded-2xl border ${sale.status === 'cancelled' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold ${sale.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{sale.items.length} médicament(s) délivré(s)</p>
                    {sale.status === 'cancelled' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Annulée</span>}
                  </div>
                  <p className="text-xs text-slate-500">{new Date(sale.paymentDate).toLocaleString('fr-FR')}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className={`font-bold ${sale.status === 'cancelled' ? 'text-slate-400' : 'text-green-600'}`}>{sale.totalAmount.toLocaleString()} FCFA</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      {sale.prescriptionId ? `Ord: ${sale.prescriptionId.slice(0,8)}` : 'Vente Libre'}
                    </p>
                    <button
                      onClick={() => setSelectedSaleForReceipt(sale)}
                      className="text-[10px] text-purple-600 hover:text-purple-800 font-bold uppercase hover:bg-purple-50 px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                      title="Imprimer / Réimprimer la facture"
                    >
                      <Printer size={12} />
                      Reçu
                    </button>
                    {sale.status !== 'cancelled' && (
                      <button 
                        onClick={() => handleCancelSale(sale.id)}
                        className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase hover:bg-red-50 px-2 py-0.5 rounded transition-all cursor-pointer"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p className="text-center text-slate-400 py-8 font-medium">Aucune vente enregistrée récemment</p>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <PackageSearch size={64} className="text-green-400 mb-6 relative z-10" />
          <h2 className="text-2xl font-black text-white mb-2 relative z-10">Gestion Rapide</h2>
          <p className="text-slate-400 mb-8 max-w-sm relative z-10">
            Scannez l'ordonnance d'un patient pour délivrer ses médicaments instantanément.
          </p>
          <Link to="/scanner" className="bg-green-500 hover:bg-green-400 text-slate-900 font-black px-8 py-4 rounded-2xl shadow-lg shadow-green-500/30 transition-all relative z-10">
            Démarrer le Scanner
          </Link>
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
