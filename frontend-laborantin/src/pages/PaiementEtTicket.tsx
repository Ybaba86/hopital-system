import { useState, useEffect } from 'react';
import { CreditCard, Printer, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface PendingPayment {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  doctor?: {
    name: string;
  };
  date: string;
  paymentStatus: string;
  isFreeRenewal?: boolean;
}

export default function PaiementEtTicket() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [selected, setSelected] = useState<PendingPayment | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const fetchPendingPayments = async () => {
    try {
      const res = await api.get('/appointments/pending-payments');
      setPendingPayments(res.data);
    } catch (error) {
      console.error('❌ Erreur récupération paiements en attente:', error);
      toast.error('Impossible de charger les paiements en attente');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
    const interval = setInterval(fetchPendingPayments, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected?.isFreeRenewal) {
      setAmount('0');
    } else {
      setAmount(''); // Laisse vide ou remet la valeur par défaut pour un nouveau paiement
    }
  }, [selected]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setLoading(true);
    try {
      await api.post('/appointments/pay', {
        appointmentId: selected.id,
        patientId: selected.patient.id,
        amount: parseFloat(amount) || 5000,
        paymentType,
      });

      toast.success(`Paiement validé pour ${selected.patient.firstName} ${selected.patient.lastName}`);
      setSelected(null);
      setAmount('');
      fetchPendingPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
        <CreditCard className="text-emerald-600" /> Facturation - Paiements en attente
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Liste cliquable des paiements en attente */}
        <div className="bg-white rounded-3xl shadow p-6">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Clock className="text-orange-600" /> Paiements en attente ({pendingPayments.length})
          </h3>

          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
              <p className="text-slate-400">Chargement des paiements...</p>
            </div>
          ) : pendingPayments.length === 0 ? (
            <p className="text-slate-400 py-12 text-center">Aucun paiement en attente</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-auto pr-2">
              {pendingPayments.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${
                    selected?.id === p.id 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-lg">
                      {p.patient.firstName} {p.patient.lastName}
                    </p>
                    <p className="text-sm text-slate-500">📞 {p.patient.phone}</p>
                    {p.doctor && <p className="text-sm text-slate-600">Dr. {p.doctor.name}</p>}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(p.date).toLocaleString('fr-FR')}
                    </p>
                    {p.isFreeRenewal && (
                      <span className="mt-2 inline-block bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-md font-bold">
                        Renouvellement gratuit
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulaire de paiement */}
        <div className="bg-white rounded-3xl shadow p-8">
          <h3 className="font-bold text-xl mb-6">
            {selected 
              ? `Paiement - ${selected.patient.firstName} ${selected.patient.lastName}` 
              : 'Paiement manuel'}
          </h3>

          <form onSubmit={handlePay} className="space-y-6">
            {selected?.isFreeRenewal && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex flex-col items-center text-center">
                <span className="font-bold text-lg mb-1">✅ Renouvellement Gratuit</span>
                <span className="text-sm">Le patient a consulté il y a moins de 5 jours. Aucun frais supplémentaire.</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">Montant (FCFA)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 ${selected?.isFreeRenewal ? 'bg-slate-100 cursor-not-allowed opacity-70' : ''}`}
                placeholder="5000"
                required
                disabled={selected?.isFreeRenewal}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Mode de paiement</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className={`w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 ${selected?.isFreeRenewal ? 'bg-slate-100 cursor-not-allowed opacity-70' : ''}`}
                disabled={selected?.isFreeRenewal}
              >
                <option value="cash">Espèces</option>
                <option value="card">Carte bancaire</option>
                <option value="orange_money">Orange Money</option>
                <option value="wave">Wave</option>
                <option value="insurance">Assurance</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !selected}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-4 rounded-3xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20} /> Validation...</>
              ) : (
                <><Printer size={20} /> Valider le paiement & générer ticket</>
              )}
            </button>

            {!selected && (
              <p className="text-center text-sm text-slate-400">
                Cliquez sur un patient dans la liste à gauche ou remplissez manuellement
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}