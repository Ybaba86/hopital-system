import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, KeyRound, ShieldCheck, CheckCircle2, X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../services/api';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // États pour la modale de récupération de mot de passe
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [useMasterKey, setUseMasterKey] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password, role: 'ADMIN' });
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('admin', JSON.stringify(res.data.user));
      toast.success('Connexion réussie !');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  // Étape 1 : Demande de code de réinitialisation
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await api.post('/auth/admin/forgot-password', { email: forgotEmail });
      setResetToken(res.data.resetToken || '');
      // Si le code est renvoyé directement par l'API
      if (res.data.code) {
        setResetCode(res.data.code);
        setForgotSuccess(`Code généré : ${res.data.code} (valable 15 minutes)`);
      } else {
        setForgotSuccess('Un code de sécurité a été généré pour votre compte.');
      }
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Erreur lors de la recherche du compte administrateur.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Étape 2 : Application du nouveau mot de passe
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (newPassword !== confirmNewPassword) {
      setForgotError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setForgotLoading(true);

    try {
      const payload: any = {
        email: forgotEmail,
        newPassword,
        resetToken,
      };

      if (useMasterKey) {
        payload.masterKey = masterKey;
      } else {
        payload.code = resetCode;
      }

      const res = await api.post('/auth/admin/reset-password', payload);
      toast.success(res.data.message || 'Mot de passe mis à jour avec succès !');
      
      // Préremplir le formulaire de login
      setEmail(forgotEmail);
      setPassword('');
      setError('');

      // Réinitialiser la modale
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setMasterKey('');
        setForgotSuccess('');
        setForgotError('');
      }, 1000);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Code invalide ou erreur serveur.');
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email || '');
    setForgotStep(1);
    setForgotError('');
    setForgotSuccess('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowForgotModal(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-animated relative">
      <Toaster position="top-right" />
      
      {/* Glassmorphism Card */}
      <div className="w-full max-w-md glass rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden animate-in zoom-in-95 duration-700">
        
        {/* Subtle inner glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-white/40 blur-3xl rounded-full"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-white/80 backdrop-blur-md text-blue-600 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-lg border border-white/50">
              MH
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Mon Hôpital</h2>
            <p className="text-slate-600 font-medium">Administration Centrale</p>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 border border-red-500/20 flex items-center gap-2 backdrop-blur-sm">
              <span className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email professionnel</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  placeholder="admin@monhopital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/60 border border-white/40 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder-slate-400 shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700">Mot de passe</label>
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/60 border border-white/40 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder-slate-400 shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 hover:-translate-y-0.5 focus:ring-4 focus:ring-slate-900/20 transition-all overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>Se connecter <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            Pas encore de compte ? <Link to="/admin/register" className="text-blue-600 hover:text-blue-800 font-bold underline decoration-2 underline-offset-4">S'inscrire</Link>
          </div>
        </div>
      </div>

      {/* ================= MODALE DE RÉCUPÉRATION DU MOT DE PASSE ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-white/60 relative overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Bouton de fermeture */}
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-all"
            >
              <X size={20} />
            </button>

            {/* En-tête */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <KeyRound size={24} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Récupération de mot de passe</h3>
                <p className="text-xs font-semibold text-slate-500">Portail Administrateur Mon Hôpital</p>
              </div>
            </div>

            {/* Message d'erreur */}
            {forgotError && (
              <div className="mb-4 p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* Message de succès */}
            {forgotSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* ÉTAPE 1 : Saisie de l'email */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <p className="text-sm text-slate-600 font-medium">
                  Entrez l'adresse email de votre compte administrateur. Un code de réinitialisation sécurisé vous sera délivré pour changer votre mot de passe.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email Administrateur</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@niang.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {forgotLoading ? <Loader2 size={18} className="animate-spin" /> : 'Continuer'}
                  </button>
                </div>
              </form>
            )}

            {/* ÉTAPE 2 : Saisie du code et du nouveau mot de passe */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="bg-blue-50/70 border border-blue-200/80 p-3 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 font-medium">
                  <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    Compte : <span className="font-bold">{forgotEmail}</span>
                    <p className="text-[11px] text-blue-700 mt-0.5">Saisissez le code de vérification à 6 chiffres ou votre clé de secours.</p>
                  </div>
                </div>

                {/* Choix entre code ou clé maître */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Méthode de vérification :</span>
                  <button
                    type="button"
                    onClick={() => setUseMasterKey(!useMasterKey)}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    {useMasterKey ? 'Utiliser le Code à 6 chiffres' : 'Utiliser la Clé de secours'}
                  </button>
                </div>

                {!useMasterKey ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Code de vérification (6 chiffres)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Ex: 849201"
                      required
                      className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Clé Maître d'urgence</label>
                    <input
                      type="text"
                      value={masterKey}
                      onChange={(e) => setMasterKey(e.target.value)}
                      placeholder="ADMIN-NIANG-2026"
                      required
                      className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-500">Clé de secours configurée par défaut : <span className="font-bold font-mono">ADMIN-NIANG-2026</span></p>
                  </div>
                )}

                {/* Nouveau mot de passe */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirmer le mot de passe */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Retapez le mot de passe"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {forgotLoading ? <Loader2 size={18} className="animate-spin" /> : 'Changer le mot de passe'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}