import { useState, useEffect, useRef } from 'react';
import { 
  ScanBarcode, 
  Search, 
  CheckCircle2, 
  ShoppingCart, 
  Trash2, 
  CreditCard, 
  Banknote, 
  RefreshCw, 
  Plus, 
  Minus, 
  User, 
  Phone, 
  Printer, 
  FileText, 
  ShoppingBag,
  Sparkles,
  ArrowRightLeft,
  History
} from 'lucide-react';
import api from '../services/api';
import ReceiptModal from '../components/ReceiptModal';

export default function ScannerOrdonnance() {
  const [activeMode, setActiveMode] = useState<'prescription' | 'over_the_counter' | 'history'>('prescription');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<any>(null);
  const [recentSalesList, setRecentSalesList] = useState<any[]>([]);
  const [searchSaleQuery, setSearchSaleQuery] = useState('');
  const [loadingSales, setLoadingSales] = useState(false);

  // Mode Prescription
  const [qrCode, setQrCode] = useState('');
  const [prescription, setPrescription] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Inventaire
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchMed, setSearchMed] = useState('');

  // Mode Vente Libre
  const [otcBarcode, setOtcBarcode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Modal de substitution
  const [substitutingItemIndex, setSubstitutingItemIndex] = useState<number | null>(null);
  const [originalMedNameInput, setOriginalMedNameInput] = useState('');

  // Panier & Paiement
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<any>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInventory();
    fetchRecentSales();
  }, []);

  const fetchRecentSales = async () => {
    setLoadingSales(true);
    try {
      const res = await api.get('/sales');
      setRecentSalesList(res.data);
    } catch (err) {
      console.error('Erreur chargement des ventes:', err);
    } finally {
      setLoadingSales(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get('/medicines');
      setInventory(res.data);
    } catch (err) {
      console.error('Erreur chargement inventaire:', err);
    }
  };

  const handleSearchPrescription = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let cleanCode = qrCode.trim();
    if (!cleanCode) return;

    // Si le scanner a lu une URL complète du type http://.../qr/CODE ou http://.../prescription/CODE
    if (cleanCode.includes('/qr/')) {
      cleanCode = cleanCode.split('/qr/').pop()?.split('?')[0].trim() || cleanCode;
    } else if (cleanCode.includes('/')) {
      cleanCode = cleanCode.split('/').pop()?.split('?')[0].trim() || cleanCode;
    }

    setLoading(true);
    setError('');
    setPrescription(null);
    setCart([]);
    setLastCompletedSale(null);

    try {
      // Essayer en priorité la route consultation (active et accessible sans blocage de token)
      let res: any = null;
      try {
        res = await api.get(`/consultations/prescription/qr/${encodeURIComponent(cleanCode)}`);
      } catch (errConsult: any) {
        // En cas d'erreur spécifique sur consultation, fallback sur la route sales
        res = await api.get(`/sales/prescription/qr/${encodeURIComponent(cleanCode)}`);
      }

      if (!res?.data) {
        setError("Ordonnance introuvable. Veuillez vérifier le code ou scanner à nouveau.");
        return;
      }

      if (res.data.type && res.data.type !== 'medication') {
        setError("Ce QR code correspond à des examens de laboratoire, pas à une ordonnance de pharmacie.");
        return;
      }

      setPrescription(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Ordonnance introuvable. Veuillez vérifier le code ou scanner à nouveau.");
      } else if (err.response?.status === 401) {
        setError("Erreur d'authentification (Token expiré). Veuillez vous déconnecter et vous reconnecter avec votre compte pharmacie.");
      } else {
        setError(err.response?.data?.error || "Erreur lors de la recherche de l'ordonnance");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(m => 
    (m.name.toLowerCase().includes(searchMed.toLowerCase()) || 
     (m.id && m.id.toLowerCase().includes(searchMed.toLowerCase()))) && 
    m.stock > 0
  );

  const addToCart = (med: any, isSubstituted = false, originalMedicineName = '') => {
    const existingIndex = cart.findIndex(item => item.medicine.id === med.id && item.isSubstituted === isSubstituted);
    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      if (existing.quantity >= med.stock) {
        alert("Stock insuffisant pour ce médicament");
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existing,
        quantity: existing.quantity + 1,
        total: (existing.quantity + 1) * existing.unitPrice
      };
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        medicine: med,
        medicineId: med.id,
        quantity: 1,
        unitPrice: med.price,
        total: med.price,
        isSubstituted,
        originalMedicineName: isSubstituted ? (originalMedicineName || med.name) : undefined
      }]);
    }
  };

  const handleOtcBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otcBarcode.trim()) return;

    const matchedMed = inventory.find(m => 
      m.id.toLowerCase() === otcBarcode.trim().toLowerCase() ||
      m.name.toLowerCase() === otcBarcode.trim().toLowerCase()
    );

    if (matchedMed) {
      if (matchedMed.stock <= 0) {
        alert(`Le médicament "${matchedMed.name}" est en rupture de stock.`);
      } else {
        addToCart(matchedMed);
        setOtcBarcode('');
      }
    } else {
      // Si recherche partielle
      const partialMatches = inventory.filter(m => 
        m.name.toLowerCase().includes(otcBarcode.trim().toLowerCase()) && m.stock > 0
      );
      if (partialMatches.length === 1) {
        addToCart(partialMatches[0]);
        setOtcBarcode('');
      } else {
        alert(`Aucun médicament trouvé pour le code ou nom: "${otcBarcode}"`);
      }
    }
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const item = cart[index];
    if (newQuantity > item.medicine.stock) {
      alert(`Stock insuffisant (${item.medicine.stock} disponible(s))`);
      return;
    }
    const updatedCart = [...cart];
    updatedCart[index] = {
      ...item,
      quantity: newQuantity,
      total: newQuantity * item.unitPrice
    };
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Substitution d'un médicament
  const openSubstitutionModal = (index: number) => {
    setSubstitutingItemIndex(index);
    setOriginalMedNameInput(cart[index]?.originalMedicineName || cart[index]?.medicine?.name || '');
  };

  const applySubstitution = (substituteMed: any) => {
    if (substitutingItemIndex === null) return;
    if (substituteMed.stock <= 0) {
      alert("Ce médicament de remplacement est en rupture de stock.");
      return;
    }

    const currentItem = cart[substitutingItemIndex];
    const originalName = originalMedNameInput.trim() || currentItem.medicine.name;

    const updatedCart = [...cart];
    updatedCart[substitutingItemIndex] = {
      ...currentItem,
      medicine: substituteMed,
      medicineId: substituteMed.id,
      unitPrice: substituteMed.price,
      total: currentItem.quantity * substituteMed.price,
      isSubstituted: true,
      originalMedicineName: originalName
    };

    setCart(updatedCart);
    setSubstitutingItemIndex(null);
    setOriginalMedNameInput('');
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const totalAmount = Math.max(0, subtotal - discount);

  const handleSale = async () => {
    if (cart.length === 0) return alert("Le panier est vide");

    setIsProcessing(true);
    try {
      const payload: any = {
        totalAmount,
        discount,
        paymentType,
        items: cart.map(c => ({
          medicineId: c.medicineId,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          total: c.total,
          isSubstituted: Boolean(c.isSubstituted),
          originalMedicineName: c.originalMedicineName || null
        }))
      };

      if (activeMode === 'prescription' && prescription) {
        payload.prescriptionId = prescription.id;
        payload.patientId = prescription.consultation?.patientId;
        payload.isOverTheCounter = false;
      } else {
        payload.isOverTheCounter = true;
        payload.customerName = customerName.trim() || 'Client Vente Libre';
        payload.customerPhone = customerPhone.trim() || null;
      }

      const res = await api.post('/sales', payload);
      const completedSaleData = {
        sale: res.data.sale,
        invoice: res.data.invoice,
        payment: res.data.sale?.payment || { receiptNumber: res.data.invoice?.receiptNumber, paymentType },
        items: res.data.sale?.items || cart,
        totalAmount,
        discount,
        paymentType,
        customerName: payload.customerName || (prescription?.consultation?.patient ? `${prescription.consultation.patient.firstName} ${prescription.consultation.patient.lastName}` : 'Client Vente Libre'),
        customerPhone: payload.customerPhone || prescription?.consultation?.patient?.phone || null,
        prescription: prescription || res.data.sale?.prescription
      };

      setLastCompletedSale(completedSaleData);
      setSelectedSaleForReceipt(completedSaleData);

      // Reset formulaire
      setPrescription(null);
      setQrCode('');
      setCart([]);
      setSearchMed('');
      setCustomerName('');
      setCustomerPhone('');
      fetchInventory(); // Rafraîchir l'inventaire
      fetchRecentSales(); // Rafraîchir les ventes
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de la validation de la vente");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = (saleItem?: any) => {
    setSelectedSaleForReceipt(saleItem || lastCompletedSale);
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-2 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-300">
      
      {/* En-tête avec Navigation par Onglets */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-800 flex items-center gap-2.5 sm:gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shrink-0">
              <ScanBarcode className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            Délivrance & Comptoir Pharmacie
          </h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
            Délivrance sécurisée d'ordonnances avec substitution autorisée et ventes libres au comptoir.
          </p>
        </div>

        {/* Boutons d'Onglets */}
        <div className="flex flex-col sm:flex-row bg-slate-100 p-1.5 rounded-2xl gap-2 w-full md:w-auto">
          <button
            onClick={() => { setActiveMode('prescription'); setCart([]); setError(''); }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeMode === 'prescription'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText size={16} />
            Délivrance sur Ordonnance
          </button>
          <button
            onClick={() => { setActiveMode('over_the_counter'); setCart([]); setError(''); }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeMode === 'over_the_counter'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShoppingBag size={16} />
            Vente Libre Sans Ordonnance
          </button>
          <button
            onClick={() => { setActiveMode('history'); fetchRecentSales(); }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeMode === 'history'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <History size={16} />
            Historique & Réimpression
          </button>
        </div>
      </div>

      {/* ZONE MODE 1 : Délivrance sur Ordonnance */}
      {activeMode === 'prescription' && (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200/80">
          <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
            <ScanBarcode className="text-emerald-600" size={24} />
            Scanner ou Saisir le Code de l'Ordonnance
          </h2>
          <form onSubmit={handleSearchPrescription} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Scannez le code-barres / QR code ou collez l'ID de l'ordonnance..." 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-base font-bold text-slate-800"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                'Rechercher Ordonnance'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-200 font-bold text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* ZONE MODE 2 : Vente Libre Sans Ordonnance */}
      {activeMode === 'over_the_counter' && (
        <div className="bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/40 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-blue-200/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-700 mb-2">
                <Sparkles size={14} /> Vente directe au comptoir
              </span>
              <h2 className="text-2xl font-black text-slate-800">Vente Libre Sans Ordonnance</h2>
              <p className="text-slate-500 text-sm font-medium">Scannez le code-barres produit ou recherchez directement le médicament dans les stocks.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User size={14} /> Nom du client (Facultatif)
              </label>
              <input
                type="text"
                placeholder="Ex: M. Amadou Diallo"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Phone size={14} /> Téléphone client (Facultatif)
              </label>
              <input
                type="tel"
                placeholder="Ex: 77 123 45 67"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <form onSubmit={handleOtcBarcodeScan} className="flex gap-3">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={22} />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scannez le code-barres produit ou saisissez le nom..."
                value={otcBarcode}
                onChange={(e) => setOtcBarcode(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-blue-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-800 text-base"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 rounded-2xl font-black shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus size={20} />
              Ajouter
            </button>
          </form>
        </div>
      )}

      {/* Détails Ordonnance chargée en mode Prescription */}
      {activeMode === 'prescription' && prescription && (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200/80">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Patient</p>
              <h3 className="text-2xl font-black text-slate-800">
                {prescription.consultation?.patient?.firstName} {prescription.consultation?.patient?.lastName}
              </h3>
              <p className="text-sm font-medium text-slate-500">
                Téléphone: {prescription.consultation?.patient?.phone || '—'}
              </p>
            </div>
            <div className="md:text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Médecin Prescripteur</p>
              <h3 className="text-lg font-bold text-emerald-700">Dr. {prescription.consultation?.doctor?.name}</h3>
              <p className="text-xs text-slate-400 font-medium">
                Prescrit le {new Date(prescription.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText size={16} /> Contenu de la prescription médicale
            </h4>
            <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-100 text-slate-800 text-lg leading-relaxed whitespace-pre-wrap font-medium">
              {prescription.content}
            </div>
          </div>

          {prescription.status === 'delivered' && (
            <div className="mt-6 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 size={20} />
              Cette ordonnance a déjà été délivrée précédemment.
            </div>
          )}
        </div>
      )}

      {/* SECTION DISPENSATION & PANIER (Accessible si prescription active ou en Vente Libre) */}
      {(activeMode === 'over_the_counter' || (activeMode === 'prescription' && prescription && prescription.status !== 'delivered')) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Colonne Gauche: Recherche de Médicaments en Stock */}
          <div className="lg:col-span-6 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200/80 flex flex-col">
            <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <Search className="text-indigo-600" size={22} />
              Catalogue & Stock Pharmacie
            </h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un médicament (nom ou référence)..."
                value={searchMed}
                onChange={(e) => setSearchMed(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2.5 pr-1">
              {filteredInventory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-medium">
                  Aucun médicament en stock ne correspond à votre recherche.
                </div>
              ) : (
                filteredInventory.slice(0, 30).map(med => (
                  <div
                    key={med.id}
                    className="p-3.5 bg-slate-50/70 hover:bg-indigo-50/60 rounded-2xl border border-slate-100 flex items-center justify-between transition-all group"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{med.name}</h4>
                      <p className="text-xs font-semibold text-slate-500">
                        {med.price.toLocaleString()} FCFA / unité
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                        med.stock > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Stock: {med.stock}
                      </span>
                      <button
                        onClick={() => addToCart(med)}
                        className="bg-white group-hover:bg-indigo-600 group-hover:text-white text-indigo-700 border border-indigo-200 group-hover:border-indigo-600 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Ajouter
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Colonne Droite: Panier, Substitution & Facturation */}
          <div className="lg:col-span-6 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <ShoppingCart className="text-emerald-600" size={22} />
                  Panier de Délivrance ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline"
                  >
                    Vider le panier
                  </button>
                )}
              </div>

              {/* Liste des articles du panier */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 mb-6">
                {cart.length === 0 ? (
                  <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <ShoppingCart className="mx-auto text-slate-300 mb-2" size={36} />
                    <p className="text-slate-400 font-medium text-sm">Le panier est vide.</p>
                    <p className="text-slate-400 text-xs mt-1">Ajoutez des médicaments depuis le stock ou scannez un code-barres.</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.isSubstituted 
                          ? 'bg-amber-50/60 border-amber-200' 
                          : 'bg-slate-50/70 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800">{item.medicine.name}</span>
                            {item.isSubstituted && (
                              <span className="inline-flex items-center gap-1 bg-amber-200 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                                <ArrowRightLeft size={10} /> Substitué
                              </span>
                            )}
                          </div>
                          {item.isSubstituted && item.originalMedicineName && (
                            <p className="text-xs font-bold text-amber-800 mt-0.5">
                              Remplacement de: <span className="italic">{item.originalMedicineName}</span>
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            {item.unitPrice.toLocaleString()} FCFA × {item.quantity} = <strong className="text-slate-800 font-bold">{item.total.toLocaleString()} FCFA</strong>
                          </p>
                        </div>

                        {/* Actions: Substitution & Suppression */}
                        <div className="flex items-center gap-1.5">
                          {activeMode === 'prescription' && (
                            <button
                              onClick={() => openSubstitutionModal(idx)}
                              className="p-1.5 bg-white text-amber-700 hover:bg-amber-100 rounded-xl border border-amber-200 text-xs font-bold flex items-center gap-1 transition-colors"
                              title="Autoriser la substitution (remplacer par un générique / équivalent)"
                            >
                              <ArrowRightLeft size={14} />
                              <span className="hidden sm:inline">Substituer</span>
                            </button>
                          )}
                          <button
                            onClick={() => removeFromCart(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Contrôle de quantité */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
                        <span className="text-xs text-slate-400 font-medium">Quantité :</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(idx, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-black text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(idx, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total, Remise & Paiement */}
            <div className="border-t border-slate-200 pt-5">
              <div className="flex justify-between items-center text-sm font-bold text-slate-500 mb-2">
                <span>Sous-total</span>
                <span className="text-slate-800 font-black">{subtotal.toLocaleString()} FCFA</span>
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-slate-500 mb-4">
                <span>Remise commerciale (FCFA)</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-28 text-right p-1.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-black text-slate-800"
                />
              </div>

              <div className="flex justify-between items-center pb-4 mb-4 border-b border-dashed border-slate-200">
                <span className="text-base font-bold text-slate-700">Net à Payer</span>
                <span className="text-3xl font-black text-emerald-700">
                  {totalAmount.toLocaleString()} <span className="text-lg">FCFA</span>
                </span>
              </div>

              {/* Choix mode de paiement */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {[
                  { id: 'cash', label: 'Espèces', icon: <Banknote size={16} /> },
                  { id: 'card', label: 'Carte', icon: <CreditCard size={16} /> },
                  { id: 'wave', label: 'Wave', icon: <span className="text-xs font-black">W</span> },
                  { id: 'orange_money', label: 'Orange Money', icon: <span className="text-xs font-black">OM</span> }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setPaymentType(mode.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                      paymentType === mode.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {mode.icon} {mode.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSale}
                disabled={cart.length === 0 || isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Validation en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    {activeMode === 'prescription' ? 'Valider Délivrance & Encaisser' : 'Valider Vente Libre & Encaisser'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUBSTITUTION D'UN MÉDICAMENT */}
      {substitutingItemIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl max-w-xl w-full p-4 sm:p-6 md:p-8 border border-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-xl font-black text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="text-amber-600 w-5 h-5" />
                Autoriser la Substitution
              </h3>
              <button
                onClick={() => setSubstitutingItemIndex(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-xl text-lg sm:text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Médicament prescrit initialement par le médecin
              </label>
              <input
                type="text"
                value={originalMedNameInput}
                onChange={(e) => setOriginalMedNameInput(e.target.value)}
                placeholder="Ex: Paracétamol 1g ou Doliprane..."
                className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 text-sm"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Sélectionnez le médicament de remplacement (générique ou équivalent en stock)
              </label>
              <div className="max-h-56 sm:max-h-60 overflow-y-auto space-y-2 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                {inventory.filter(m => m.stock > 0).map(subMed => (
                  <div
                    key={subMed.id}
                    onClick={() => applySubstitution(subMed)}
                    className="p-2.5 sm:p-3 bg-white hover:bg-amber-50 rounded-xl border border-slate-100 hover:border-amber-300 cursor-pointer flex justify-between items-center transition-all group"
                  >
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-amber-900 text-sm sm:text-base">{subMed.name}</p>
                      <p className="text-xs text-slate-500">{subMed.price.toLocaleString()} FCFA</p>
                    </div>
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg">
                      En stock: {subMed.stock}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSubstitutingItemIndex(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ZONE MODE 3 : Historique des Ventes & Réimpression */}
      {activeMode === 'history' && (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200/80">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-700 mb-2">
                <Printer size={14} /> Facturation & Duplicatas
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                Historique des Ventes & Réimpression
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium">
                Retrouvez n'importe quelle vente passée pour rééditer la facture ou le ticket de caisse.
              </p>
            </div>
            <button
              onClick={fetchRecentSales}
              disabled={loadingSales}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-stretch sm:self-auto justify-center cursor-pointer"
            >
              <RefreshCw className={loadingSales ? 'animate-spin' : ''} size={15} />
              Actualiser
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par N° de reçu, nom de client, médicament..."
              value={searchSaleQuery}
              onChange={(e) => setSearchSaleQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-medium text-sm"
            />
          </div>

          {/* Liste des ventes */}
          {loadingSales ? (
            <div className="py-12 text-center text-slate-400 font-medium flex items-center justify-center gap-2">
              <RefreshCw className="animate-spin text-purple-500" size={20} />
              Chargement des ventes...
            </div>
          ) : (
            <div className="space-y-3">
              {recentSalesList
                .filter((sale: any) => {
                  if (!searchSaleQuery) return true;
                  const q = searchSaleQuery.toLowerCase();
                  const receipt = (sale.payment?.receiptNumber || '').toLowerCase();
                  const client = (sale.customerName || (sale.prescription?.consultation?.patient ? `${sale.prescription.consultation.patient.firstName} ${sale.prescription.consultation.patient.lastName}` : '')).toLowerCase();
                  const meds = (sale.items?.map((i: any) => i.medicine?.name).join(' ') || '').toLowerCase();
                  return receipt.includes(q) || client.includes(q) || meds.includes(q);
                })
                .map((sale: any) => {
                  const receiptNum = sale.payment?.receiptNumber || `REC-${sale.id.slice(0, 8).toUpperCase()}`;
                  const client = sale.customerName || (sale.prescription?.consultation?.patient ? `${sale.prescription.consultation.patient.firstName} ${sale.prescription.consultation.patient.lastName}` : 'Client Vente Libre');
                  const dateStr = new Date(sale.paymentDate).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return (
                    <div
                      key={sale.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        sale.status === 'cancelled'
                          ? 'bg-red-50/50 border-red-200'
                          : 'bg-slate-50/80 hover:bg-purple-50/40 border-slate-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-slate-800 text-sm">{receiptNum}</span>
                          <span className="text-xs text-slate-400">• {dateStr}</span>
                          {sale.status === 'cancelled' ? (
                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              Annulée
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              Validée
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                            {sale.isOverTheCounter ? 'Vente Libre' : 'Ordonnance'}
                          </span>
                        </div>

                        <p className="font-bold text-slate-800 text-sm mt-1">
                          Client : <span className="text-slate-900">{client}</span>
                          {sale.prescription?.consultation?.doctor && (
                            <span className="text-xs text-slate-500 font-normal ml-2">
                              (Dr. {sale.prescription.consultation.doctor.name})
                            </span>
                          )}
                        </p>

                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1.5">
                          {sale.items?.map((item: any, idx: number) => (
                            <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-medium">
                              {item.quantity}x {item.medicine?.name || item.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-black text-slate-900 text-base sm:text-lg">
                            {sale.totalAmount.toLocaleString()} FCFA
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer size={15} />
                          Réimprimer Facture
                        </button>
                      </div>
                    </div>
                  );
                })}

              {recentSalesList.length === 0 && (
                <div className="py-12 text-center text-slate-400 font-medium">
                  Aucune vente enregistrée pour le moment.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FACTURE / TICKET DE CAISSE APRÈS VENTE */}
      {lastCompletedSale && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 md:p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 mb-2">
              <CheckCircle2 size={14} /> Vente enregistrée avec succès
            </div>
            <h3 className="text-2xl font-black text-slate-800">
              Reçu N° {lastCompletedSale.payment?.receiptNumber || lastCompletedSale.invoice?.receiptNumber || lastCompletedSale.invoice?.saleId || 'VALIDÉ'}
            </h3>
            <p className="text-slate-600 text-sm font-medium mt-1">
              Client: <strong>{lastCompletedSale.customerName}</strong> • Montant: <strong>{lastCompletedSale.totalAmount.toLocaleString()} FCFA</strong> ({lastCompletedSale.paymentType?.toUpperCase()})
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handlePrintReceipt(lastCompletedSale)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <Printer size={18} /> Imprimer Reçu
            </button>
            <button
              onClick={() => setLastCompletedSale(null)}
              className="bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 px-5 py-3 rounded-2xl font-bold transition-all text-sm cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE FACTURE & RÉIMPRESSION */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}
    </div>
  );
}
