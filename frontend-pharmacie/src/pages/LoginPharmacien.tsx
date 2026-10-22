import { useState } from 'react';
import { Activity, Lock, Mail, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function LoginPharmacien() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.user.role !== 'PHARMACIEN' && res.data.user.role !== 'ADMIN') {
        setError('Accès refusé. Réservé au personnel de pharmacie.');
        return;
      }
      localStorage.setItem('pharmacienToken', res.data.token);
      localStorage.setItem('pharmacien', JSON.stringify(res.data.user));
      window.location.href = '/dashboard';
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: any) {
      setError(err.response?.data?.error || 'Identifiants incorrects');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-400 shadow-lg shadow-green-500/30 mb-6">
              <Activity className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Portail Pharmacie</h1>
            <p className="text-slate-500 font-medium mt-2">Connectez-vous pour accéder à l'officine</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Email professionnel</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="pharmacien@hopital.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 group mt-8"
            >
              Se connecter
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
