import { useState, useEffect } from 'react';
import { CreditCard, Printer, Clock, Loader2, Smartphone, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface PendingPayment {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    uniqueNumber?: string;
  };
  doctor?: {
    name: string;
  };
  date: string;
  paymentStatus: string;
  paymentMethod?: string;
  isFreeRenewal?: boolean;
  isVip?: boolean;
  latestPayment?: {
    id: string;
    amount: number;
    paymentType: string;
    status: string;
    description: string;
    receiptNumber: string;
    paymentDate: string;
  };
}

export default function PaiementEtTicket() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [selected, setSelected] = useState<PendingPayment | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [cashierNote, setCashierNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'on_site' | 'online_pending'>('all');

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
    setShowRejectInput(false);
    setRejectReason('');
    setCashierNote('');

    if (selected?.isFreeRenewal) {
      setAmount('0');
    } else if (selected?.paymentStatus === 'pending_confirmation') {
      const onlineAmount = selected.latestPayment?.amount || (selected.isVip ? 15000 : 5000);
      setAmount(String(onlineAmount));
      setPaymentType(selected.latestPayment?.paymentType || 'online');
    } else {
      setAmount(selected?.isVip ? '15000' : '5000');
      setPaymentType('cash');
    }
  }, [selected]);

  // 1. Validation paiement au comptoir (sur place)
  const handlePayOnSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setLoading(true);
    try {
      await api.post('/appointments/pay', {
        appointmentId: selected.id,
        patientId: selected.patient.id,
        amount: amount === '' ? 5000 : parseFloat(amount),
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

  // 2. Confirmation paiement en ligne par la caisse
  const handleConfirmOnline = async () => {
    if (!selected) return;

    setLoading(true);
    try {
      const res = await api.post('/appointments/confirm-online-payment', {
        appointmentId: selected.id,
        cashierNote: cashierNote.trim() || undefined,
      });

      toast.success(res.data.message || `Paiement en ligne confirmé pour ${selected.patient.firstName} ${selected.patient.lastName} !`);
      setSelected(null);
      fetchPendingPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation du paiement en ligne');
    } finally {
      setLoading(false);
    }
  };

  // 3. Rejet paiement en ligne par la caisse
  const handleRejectOnline = async () => {
    if (!selected) return;

    setLoading(true);
    try {
      const res = await api.post('/appointments/reject-online-payment', {
        appointmentId: selected.id,
        reason: rejectReason.trim() || 'Paiement non constaté sur le compte marchand',
      });

      toast.success(res.data.message || 'Paiement en ligne rejeté.');
      setSelected(null);
      setShowRejectInput(false);
      fetchPendingPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du rejet');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage par onglet
  const onlinePendingList = pendingPayments.filter(p => p.paymentStatus === 'pending_confirmation');
  const onSiteList = pendingPayments.filter(p => p.paymentStatus !== 'pending_confirmation');

  const displayedPayments = activeTab === 'all' 
    ? pendingPayments 
    : activeTab === 'online_pending' 
      ? onlinePendingList 
      : onSiteList;

  const isOnlineSelected = selected?.paymentStatus === 'pending_confirmation';

  return (
    <div className="w-full mx-auto p-2 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-slate-900">
            <CreditCard className="text-emerald-600" /> Facturation & File d'Attente
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Validation des encaissements au comptoir et vérification des paiements mobiles (Wave, Orange Money)
          </p>
        </div>

        {/* Compteur d'alertes en ligne */}
        {onlinePendingList.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm animate-pulse">
            <Smartphone size={18} className="text-blue-600 shrink-0" />
            <span>{onlinePendingList.length} paiement(s) en ligne à confirmer</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Colonne de gauche : Liste avec Onglets */}
        <div className="lg:col-span-6 bg-white rounded-3xl shadow-sm border border-slate-200/80 p-4 sm:p-6 flex flex-col h-full">
          {/* Onglets de filtrage */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl mb-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'all' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({pendingPayments.length})
            </button>
            <button
              onClick={() => setActiveTab('on_site')}
              className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'on_site' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sur place ({onSiteList.length})
            </button>
            <button
              onClick={() => setActiveTab('online_pending')}
              className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'online_pending' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Smartphone size={14} />
              En ligne ({onlinePendingList.length})
            </button>
          </div>

          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
              <p className="text-slate-400 font-medium">Chargement des paiements...</p>
            </div>
          ) : displayedPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-400" />
              <p className="text-slate-500 font-bold">Aucun paiement en attente dans cette catégorie</p>
              <p className="text-xs text-slate-400">Tous les règlements ont été traités</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[580px] overflow-auto pr-1">
              {displayedPayments.map((p) => {
                const isOnline = p.paymentStatus === 'pending_confirmation';
                const isSelected = selected?.id === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${
                      isSelected
                        ? isOnline 
                          ? 'border-blue-500 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20' 
                          : 'border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                        : isOnline
                          ? 'border-blue-200 bg-blue-50/20 hover:bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base sm:text-lg text-slate-900">
                          {p.patient.firstName} {p.patient.lastName}
                        </p>
                        {p.patient.uniqueNumber && (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {p.patient.uniqueNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        {p.patient.phone && <span>📞 {p.patient.phone}</span>}
                        {p.doctor && <span className="font-medium text-slate-700">👨‍⚕️ Dr. {p.doctor.name}</span>}
                      </div>

                      <p className="text-[11px] text-slate-400 font-medium">
                        Prévu le : {new Date(p.date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* Badge de statut */}
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-lg font-bold border border-blue-200">
                            <Smartphone size={12} />
                            En ligne à confirmer ({p.latestPayment?.paymentType?.toUpperCase() || 'WAVE'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-lg font-bold">
                            <Clock size={12} />
                            Sur place (guichet)
                          </span>
                        )}

                        {p.isFreeRenewal && (
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-md font-bold">
                            Renouvellement gratuit
                          </span>
                        )}

                        {p.isVip && (
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-md font-bold">
                            VIP
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base sm:text-lg font-black text-slate-900">
                        {p.isFreeRenewal ? '0 FCFA' : `${p.latestPayment?.amount || (p.isVip ? 15000 : 5000)} F`}
                      </p>
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        {isSelected ? 'Sélectionné' : 'Choisir →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne de droite : Panneau de traitement */}
        <div className="lg:col-span-6 bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <h3 className="font-extrabold text-xl text-slate-900">
                {selected 
                  ? `${isOnlineSelected ? '📱 Confirmation' : '💵 Encaissement'} - ${selected.patient.firstName} ${selected.patient.lastName}` 
                  : 'Panneau de Traitement Caisse'}
              </h3>
              {selected && (
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Désélectionner
                </button>
              )}
            </div>

            {selected ? (
              isOnlineSelected ? (
                /* ================= FORMULAIRE DE CONFIRMATION EN LIGNE ================= */
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        Paiement Mobile Déclaré par le patient
                      </span>
                      <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
                        {selected.latestPayment?.paymentType || 'En ligne'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-xs font-bold text-slate-500">Montant versé</p>
                        <p className="text-2xl font-black text-blue-900">
                          {selected.latestPayment?.amount || (selected.isVip ? 15000 : 5000)} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500">Numéro du patient</p>
                        <p className="text-base font-bold text-slate-900">
                          {selected.patient.phone || 'Non renseigné'}
                        </p>
                      </div>
                    </div>

                    {selected.latestPayment?.description && (
                      <div className="pt-2 border-t border-blue-200/60 text-xs text-blue-800">
                        <span className="font-bold">Détails :</span> {selected.latestPayment.description}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">
                      Note de l'agent de caisse (Facultatif)
                    </label>
                    <input
                      type="text"
                      value={cashierNote}
                      onChange={(e) => setCashierNote(e.target.value)}
                      placeholder="Ex: Vérifié sur terminal Wave #TRX-948"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  {showRejectInput && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 animate-in fade-in">
                      <label className="text-xs font-bold text-red-800">
                        Motif du rejet (visible par le patient)
                      </label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Ex: Aucun virement correspondant reçu sur Wave"
                        className="w-full p-3 bg-white border border-red-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleRejectOnline}
                          disabled={loading}
                          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors"
                        >
                          Confirmer le rejet
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRejectInput(false)}
                          className="py-2.5 px-4 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {!showRejectInput && (
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleConfirmOnline}
                        disabled={loading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                      >
                        {loading ? (
                          <><Loader2 className="animate-spin" size={20} /> Validation...</>
                        ) : (
                          <><CheckCircle2 size={20} /> Confirmer le paiement & Activer ticket</>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRejectInput(true)}
                        disabled={loading}
                        className="py-4 px-5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl text-sm border border-red-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle size={18} />
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ================= FORMULAIRE PAIEMENT SUR PLACE ================= */
                <form onSubmit={handlePayOnSite} className="space-y-6">
                  {selected.isFreeRenewal && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3">
                      <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">Renouvellement Gratuit appliqué</p>
                        <p className="text-xs text-emerald-700">Le patient a déjà consulté il y a moins de 5 jours. Tarif fixé à 0 FCFA.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Montant de la consultation (FCFA)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold text-lg ${
                        selected.isFreeRenewal ? 'bg-slate-100 cursor-not-allowed opacity-70' : 'bg-slate-50 focus:bg-white'
                      }`}
                      placeholder="5000"
                      required
                      disabled={selected.isFreeRenewal}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Mode de règlement guichet</label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className={`w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium ${
                        selected.isFreeRenewal ? 'bg-slate-100 cursor-not-allowed opacity-70' : 'bg-slate-50 focus:bg-white'
                      }`}
                      disabled={selected.isFreeRenewal}
                    >
                      <option value="cash">💵 Espèces (Cash)</option>
                      <option value="card">💳 Carte bancaire</option>
                      <option value="orange_money">📱 Orange Money (Guichet)</option>
                      <option value="wave">📱 Wave (Guichet)</option>
                      <option value="insurance">🛡️ Prise en charge assurance</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                  >
                    {loading ? (
                      <><Loader2 className="animate-spin" size={20} /> Encaissement...</>
                    ) : (
                      <><Printer size={20} /> Valider l'encaissement & Imprimer ticket</>
                    )}
                  </button>
                </form>
              )
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <CreditCard size={32} />
                </div>
                <p className="font-bold text-slate-700 text-base">Aucun dossier sélectionné</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Sélectionnez un patient dans la colonne de gauche pour encaisser un paiement au comptoir ou confirmer un virement mobile en ligne.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}