import { useState } from 'react';
import { CreditCard, QrCode, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function LaboratoireCaisse() {
  const [qrCode, setQrCode] = useState('');
  const [prescription, setPrescription] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode) return;
    
    setLoadingSearch(true);
    try {
      const res = await api.get(`/consultations/prescription/qr/${qrCode}`);
      if (res.data.type !== 'lab') {
        toast.error("Ce code-barres n'appartient pas à une ordonnance d'analyse.");
        setPrescription(null);
      } else if (res.data.status === 'paid') {
        toast.error("Cette ordonnance a déjà été payée.");
        setPrescription(null);
      } else {
        setPrescription(res.data);
      }
    } catch (error) {
      toast.error('Ordonnance introuvable');
      setPrescription(null);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescription) return;

    setLoadingPay(true);
    try {
      await api.post('/lab/pay-prescription', {
        prescriptionId: prescription.id,
        patientId: prescription.consultation.patientId,
        amount: parseFloat(amount) || 10000, // Prix par défaut si vide
        paymentType,
      });

      toast.success(`Paiement validé ! Patient ajouté en file labo.`);
      setPrescription(null);
      setQrCode('');
      setAmount('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du paiement');
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <div className="w-full mx-auto p-2 sm:p-6">
      <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 flex items-center gap-3">
        <CreditCard className="text-emerald-600" /> Facturation Laboratoire & Examens Médicaux
      </h2>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8 border border-slate-100">
        <h3 className="font-bold text-lg sm:text-xl mb-4 flex items-center gap-2 text-slate-700">
          <QrCode className="text-blue-500" /> Scanner le bulletin d'examen médical
        </h3>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:w-2/3">
          <input
            type="text"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            placeholder="Ex: QR-LAB-12345 ou saisissez le code..."
            className="flex-1 p-3.5 sm:p-4 border border-slate-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/20 text-base sm:text-lg outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={loadingSearch || !qrCode}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3.5 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm sm:text-base"
          >
            {loadingSearch ? <Loader2 className="animate-spin" /> : <Search />}
            Vérifier
          </button>
        </form>
      </div>

      {prescription && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-8 border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          <h3 className="font-bold text-xl sm:text-2xl mb-4 sm:mb-6">Détails du Bulletin d’Examen Médical</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <p className="text-slate-500 text-sm">Patient</p>
              <p className="font-bold text-lg">{prescription.consultation.patient.firstName} {prescription.consultation.patient.lastName}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Médecin Prescripteur</p>
              <p className="font-bold text-lg">Dr. {prescription.consultation.doctor.name}</p>
            </div>
            <div className="col-span-1 sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-slate-500 text-sm mb-2">Analyses demandées :</p>
              <p className="whitespace-pre-wrap font-medium text-slate-800 text-sm sm:text-base">{prescription.content}</p>
            </div>
          </div>

          <form onSubmit={handlePay} className="space-y-4 sm:space-y-6 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-base sm:text-lg mb-2">Règlement</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-bold mb-2">Montant (FCFA)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 15000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Mode de paiement</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">Espèces</option>
                  <option value="card">Carte bancaire</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="wave">Wave</option>
                  <option value="insurance">Assurance</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingPay}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {loadingPay ? <Loader2 className="animate-spin" /> : 'Valider le paiement & Envoyer au labo'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
