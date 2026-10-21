import { useState } from 'react';
// No navigate needed
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function LoginLaborantin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // navigate is removed

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.user.role !== 'LABORANTIN') {
        toast.error('Accès refusé. Vous devez être technicien de laboratoire.');
        setLoading(false);
        return;
      }

      localStorage.setItem('laborantinToken', res.data.token);
      localStorage.setItem('laborantin', JSON.stringify(res.data.user));
      toast.success("Connexion réussie !");
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error('Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2rem] shadow-xl max-w-md w-full">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-emerald-600 mb-2">Espace Laboratoire</h2>
          <p className="text-slate-500 font-medium">Connexion Technicien</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                <Mail size={20} />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                required
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>Se connecter <ArrowRight size={20} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
