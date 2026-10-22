import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, Droplet, AlertTriangle, Loader2, ArrowRight, Scale, Ruler, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function RegisterPatient() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    weight: '',
    height: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bloodGroup: '',
    allergies: '',
    familyHistory: '',
    hospitalId: ''
  });
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await api.get('/hospitals');
        setHospitals(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHospitals();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 0) {
      toast.error("Veuillez renseigner votre âge (obligatoire)");
      return;
    }
    if (!form.bloodGroup) {
      toast.error('Veuillez sélectionner votre groupe sanguin');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await api.post('/patients', {
        firstName: form.firstName,
        lastName: form.lastName,
        age: Number(form.age),
        weight: form.weight ? parseFloat(form.weight) : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        email: form.email,
        phone: form.phone,
        password: form.password,
        bloodGroup: form.bloodGroup,
        allergies: form.allergies || undefined,
        familyHistory: form.familyHistory || undefined,
        hospitalId: form.hospitalId
      });
      toast.success("Inscription réussie ! Vous pouvez vous connecter.");
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[60%] rounded-full bg-indigo-400/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl border border-white/50">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Inscription</h2>
            <p className="text-slate-600 font-medium">Rejoignez votre espace santé personnel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User size={20} />
                </div>
                <input type="text" name="firstName" placeholder="Prénom" value={form.firstName} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700" required />
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User size={20} />
                </div>
                <input type="text" name="lastName" placeholder="Nom" value={form.lastName} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700" required />
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Mail size={20} />
              </div>
              <input type="email" name="email" placeholder="Adresse email" value={form.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700" required />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Phone size={20} />
              </div>
              <input type="tel" name="phone" placeholder="Numéro de téléphone" value={form.phone} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input type="password" name="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700" required />
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input type="password" name="confirmPassword" placeholder="Confirmer mot de passe" value={form.confirmPassword} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700" required />
              </div>
            </div>

            {/* Âge (Obligatoire), Poids et Taille (Optionnels) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600 group-focus-within:text-emerald-700 transition-colors">
                  <Calendar size={18} />
                </div>
                <input 
                  type="number" 
                  min="0"
                  max="130"
                  name="age" 
                  placeholder="Âge (ans) *" 
                  value={form.age} 
                  onChange={handleChange} 
                  className="w-full pl-10 pr-3 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-slate-700 text-xs sm:text-sm font-semibold placeholder:text-xs placeholder:text-slate-400 placeholder:font-normal" 
                  required 
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-600 group-focus-within:text-teal-700 transition-colors">
                  <Scale size={18} />
                </div>
                <input 
                  type="number" 
                  step="0.1"
                  min="1"
                  max="350"
                  name="weight" 
                  placeholder="Poids (kg - optionnel)" 
                  value={form.weight} 
                  onChange={handleChange} 
                  className="w-full pl-10 pr-3 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none text-slate-700 text-xs sm:text-sm placeholder:text-xs placeholder:text-slate-400 placeholder:font-normal" 
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-600 group-focus-within:text-cyan-700 transition-colors">
                  <Ruler size={18} />
                </div>
                <input 
                  type="number" 
                  step="1"
                  min="30"
                  max="250"
                  name="height" 
                  placeholder="Taille (cm - optionnel)" 
                  value={form.height} 
                  onChange={handleChange} 
                  className="w-full pl-10 pr-3 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none text-slate-700 text-xs sm:text-sm placeholder:text-xs placeholder:text-slate-400 placeholder:font-normal" 
                />
              </div>
            </div>

            {/* Groupe Sanguin (Obligatoire) & Allergies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500 group-focus-within:text-red-600 transition-colors">
                  <Droplet size={18} />
                </div>
                <select 
                  name="bloodGroup" 
                  value={form.bloodGroup} 
                  onChange={handleChange} 
                  className={`w-full pl-10 pr-6 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-xs sm:text-sm cursor-pointer ${
                    !form.bloodGroup ? 'text-slate-400 font-normal' : 'text-slate-700 font-semibold'
                  }`}
                  required
                >
                  <option value="" disabled className="text-slate-400">Groupe sanguin *</option>
                  <option value="A+" className="text-slate-700 font-semibold">A+</option>
                  <option value="A-" className="text-slate-700 font-semibold">A-</option>
                  <option value="B+" className="text-slate-700 font-semibold">B+</option>
                  <option value="B-" className="text-slate-700 font-semibold">B-</option>
                  <option value="AB+" className="text-slate-700 font-semibold">AB+</option>
                  <option value="AB-" className="text-slate-700 font-semibold">AB-</option>
                  <option value="O+" className="text-slate-700 font-semibold">O+</option>
                  <option value="O-" className="text-slate-700 font-semibold">O-</option>
                </select>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <AlertTriangle size={18} />
                </div>
                <input 
                  type="text" 
                  name="allergies" 
                  placeholder="Allergies (Ex: Pénicilline...)" 
                  value={form.allergies} 
                  onChange={handleChange} 
                  className="w-full pl-10 pr-3 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-xs sm:text-sm placeholder:text-xs placeholder:text-slate-400 placeholder:font-normal" 
                />
              </div>
            </div>

            {/* Antécédents Familiaux */}
            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                Antécédents Familiaux (Héréditaires / Famille)
              </label>
              <textarea
                name="familyHistory"
                rows={2}
                placeholder="Ex: Diabète type 2 (père), Hypertension (mère), Cardiopathie..."
                value={form.familyHistory}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
              />
            </div>

            <div className="relative group">
              <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Hôpital de rattachement</label>
              <select 
                name="hospitalId" 
                value={form.hospitalId} 
                onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 appearance-none" 
                required
              >
                <option value="">-- Veuillez choisir votre hôpital --</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 mt-6 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-slate-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}