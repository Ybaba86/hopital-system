import { useState, useEffect } from 'react';
import { ClipboardCheck, Pill, TestTube, Send, AlertCircle, Activity, ShieldAlert, CheckSquare, Scale, Ruler } from 'lucide-react';
import api from '../services/api';

interface ConsultationFormProps {
  patientId: string;
  patientName?: string;
  ticketId?: string;
  consultationId?: string; // For editing
  initialData?: any; // For editing
  onSuccess: () => void;
}

export default function ConsultationForm({ 
  patientId, 
  patientName, 
  ticketId, 
  consultationId,
  initialData,
  onSuccess 
}: ConsultationFormProps) {

  const [formData, setFormData] = useState({
    symptoms: initialData?.symptoms || '',
    diagnosis: initialData?.diagnosis || '',
    treatment: initialData?.treatment || '',
    sickLeave: initialData?.sickLeave || false,
    referralNote: initialData?.referralNote || '',
    medicationPrescription: '',
    labPrescription: '',
  });

  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [patientAge, setPatientAge] = useState<string | number>('');
  const [patientWeight, setPatientWeight] = useState<string | number>('');
  const [patientHeight, setPatientHeight] = useState<string | number>('');
  const [checkedAntecedents, setCheckedAntecedents] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Charger les antécédents du patient
  useEffect(() => {
    if (!patientId) return;
    api.get(`/patients/${patientId}`)
      .then(res => {
        setPatientInfo(res.data);
        if (res.data.age !== undefined && res.data.age !== null) setPatientAge(res.data.age);
        if (res.data.weight !== undefined && res.data.weight !== null) setPatientWeight(res.data.weight);
        if (res.data.height !== undefined && res.data.height !== null) setPatientHeight(res.data.height);
      })
      .catch(err => console.error("Erreur chargement patient:", err));
  }, [patientId]);

  // Validation en temps réel
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    if (name === 'symptoms' && value.trim().length < 5) {
      newErrors.symptoms = 'Veuillez renseigner les motifs cliniques (minimum 5 caractères)';
    } else if (name === 'symptoms') {
      delete newErrors.symptoms;
    }

    if (name === 'diagnosis' && value.trim() === '') {
      newErrors.diagnosis = 'Le diagnostic est obligatoire';
    } else if (name === 'diagnosis') {
      delete newErrors.diagnosis;
    }

    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, sickLeave: e.target.checked }));
  };

  const isFormValid = () => {
    return (
      formData.symptoms.trim().length >= 5 &&
      formData.diagnosis.trim() !== '' &&
      checkedAntecedents === true &&
      Object.keys(errors).length === 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation finale
    if (!isFormValid()) {
      if (!checkedAntecedents) {
        setServerError("Veuillez obligatoirement attester avoir vérifié les antécédents et contre-indications du patient.");
        return;
      }
      setErrors({
        symptoms: formData.symptoms.trim().length < 5 ? 'Renseignements cliniques / motifs requis' : '',
        diagnosis: formData.diagnosis.trim() === '' ? 'Le diagnostic est obligatoire' : '',
      });
      return;
    }

    setLoading(true);
    setServerError(null);

    const doctorData = localStorage.getItem('medecin');
    if (!doctorData) {
      setServerError("Session expirée. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    let doctor;
    try {
      doctor = JSON.parse(doctorData);
    } catch {
      setServerError("Données de session invalides.");
      setLoading(false);
      return;
    }

    // Mise à jour optionnelle des mensurations du patient si renseignées
    if (patientAge || patientWeight || patientHeight) {
      try {
        await api.put(`/patients/${patientId}`, {
          ...(patientAge && { age: Number(patientAge) }),
          weight: patientWeight ? parseFloat(String(patientWeight)) : null,
          height: patientHeight ? parseFloat(String(patientHeight)) : null,
        });
      } catch (vitalErr) {
        console.warn("Mise à jour mensurations patient non bloquante:", vitalErr);
      }
    }

    const payload = {
      symptoms: formData.symptoms.trim(),
      diagnosis: formData.diagnosis.trim(),
      treatment: formData.treatment.trim() || "Aucun traitement spécifié",
      sickLeave: formData.sickLeave,
      referralNote: formData.referralNote.trim(),
      patientId,
      doctorId: doctor.id,
    };

    try {
      let consultationRes;
      if (consultationId) {
        consultationRes = await api.put(`/consultations/${consultationId}`, payload);
      } else {
        consultationRes = await api.post('/consultations', payload);
      }
      
      const savedConsultationId = consultationId || consultationRes.data.id;

      // Prescriptions
      const promises: Promise<any>[] = [];
      if (formData.medicationPrescription.trim() && !consultationId) {
        promises.push(
          api.post(`/consultations/${savedConsultationId}/prescription`, {
            type: 'medication',
            content: formData.medicationPrescription.trim()
          })
        );
      }
      if (formData.labPrescription.trim() && !consultationId) {
        promises.push(
          api.post(`/consultations/${savedConsultationId}/prescription`, {
            type: 'lab',
            content: formData.labPrescription.trim()
          })
        );
      }
      if (promises.length > 0) await Promise.all(promises);

      // Marquer le ticket comme terminé si on vient de la file d'attente
      if (ticketId && !consultationId) {
        await api.put(`/queue/ticket/${ticketId}`, { status: 'completed' });
      }

      alert(`✅ Consultation ${consultationId ? 'modifiée' : 'enregistrée'} avec succès !`);
      onSuccess();
    } catch (error: any) {
      console.error(error);
      setServerError(error.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const imcData = (() => {
    const w = Number(patientWeight);
    const h = Number(patientHeight);
    if (!w || !h || h <= 0) return null;
    const val = (w / ((h / 100) ** 2)).toFixed(1);
    const num = parseFloat(val);
    let cat = "Normal";
    if (num < 18.5) cat = "Maigreur";
    else if (num >= 25 && num < 30) cat = "Surpoids";
    else if (num >= 30) cat = "Obésité";
    return { val, cat };
  })();

  return (
    <div className="bg-white/95 backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-5 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Activity size={150} />
        </div>
        <div className="flex items-center gap-3 sm:gap-5 relative z-10">
          <div className="bg-white/20 p-2.5 sm:p-3 rounded-2xl backdrop-blur-sm border border-white/30 shrink-0">
            <ClipboardCheck size={26} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-indigo-100 uppercase tracking-widest mb-0.5">
              {consultationId ? 'Modification Consultation' : 'Nouvelle consultation'}
            </p>
            <p className="text-xl sm:text-3xl font-black">{patientName || 'Patient'}</p>
          </div>
        </div>
        
        {ticketId && (
          <div className="relative z-10 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/30 font-bold tracking-widest text-xs sm:text-sm">
            TICKET #{ticketId}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4">
            <AlertCircle size={20} className="mt-0.5 text-red-500 shrink-0" />
            <span className="font-medium text-sm sm:text-base">{serverError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Renseignement Clinique (Motif de la consultation) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
              Renseignement Clinique (Motif de la consultation) <span className="text-red-500">*</span>
            </label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              onBlur={(e) => validateField('symptoms', e.target.value)}
              className={`w-full p-5 bg-slate-50 border-2 rounded-[2rem] focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-700 ${errors.symptoms ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-slate-100 focus:border-indigo-500'}`}
              rows={3}
              placeholder="Décrivez les motifs de la consultation et les renseignements cliniques..."
              required
            />
            {errors.symptoms && <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1"><AlertCircle size={14}/>{errors.symptoms}</p>}
          </div>

          {/* Diagnostic */}
          <div>
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
              Diagnostic <span className="text-red-500">*</span>
            </label>
            <input
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              onBlur={(e) => validateField('diagnosis', e.target.value)}
              className={`w-full p-5 bg-slate-50 border-2 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all shadow-inner font-bold text-slate-800 ${errors.diagnosis ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-slate-100 focus:border-indigo-500'}`}
              placeholder="Diagnostic principal"
              required
            />
            {errors.diagnosis && <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1"><AlertCircle size={14}/>{errors.diagnosis}</p>}
          </div>

          {/* Traitements Médicales (Prescription) */}
          <div>
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
              Traitements Médicales (Prescription)
            </label>
            <input
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-700"
              placeholder="Traitements médicaux prescrits, posologie, repos..."
            />
          </div>
        </div>

        {/* Prescriptions */}
        <div className="bg-indigo-50/50 rounded-[2rem] p-8 border border-indigo-50 space-y-6">
          <h3 className="text-lg font-black text-indigo-900 flex items-center gap-2">
            <Pill className="text-indigo-600" /> Prescriptions Médicales
          </h3>

          {/* VÉRIFICATION DES ANTÉCÉDENTS DU PATIENT PAR LE MÉDECIN AVANT TOUT AJOUT DE MÉDICAMENT */}
          <div className="bg-white rounded-2xl p-6 border-2 border-amber-300 shadow-md space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    Vérification obligatoire des antécédents avant prescription
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Le médecin doit vérifier les antécédents et allergies du patient pour adapter le choix des molécules.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300 shrink-0">
                Sécurité Médicale
              </span>
            </div>

            {/* Mensurations & Constantes Cliniques (Âge Obligatoire, Poids et Taille Optionnels) */}
            <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>Mensurations Cliniques</span>
                  <span className="text-[11px] font-semibold text-slate-500 normal-case">(Âge obligatoire pour le dosage)</span>
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Mise à jour automatique
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-emerald-50/90 rounded-xl border border-emerald-200">
                  <label className="text-[10px] font-black uppercase text-emerald-800 block mb-1">
                    Âge (Obligatoire) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="130"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="Ex: 34"
                      className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg font-black text-sm text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-400 shadow-inner"
                      required
                    />
                    <span className="text-xs font-bold text-emerald-800 shrink-0">ans</span>
                  </div>
                </div>

                <div className="p-2.5 bg-teal-50/90 rounded-xl border border-teal-200">
                  <label className="text-[10px] font-black uppercase text-teal-800 block mb-1 flex items-center gap-1">
                    <Scale size={11} /> Poids (Optionnel)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="350"
                      value={patientWeight}
                      onChange={(e) => setPatientWeight(e.target.value)}
                      placeholder="Ex: 72"
                      className="w-full p-1.5 bg-white border border-teal-300 rounded-lg font-black text-sm text-teal-950 outline-none focus:ring-2 focus:ring-teal-400 shadow-inner"
                    />
                    <span className="text-xs font-bold text-teal-800 shrink-0">kg</span>
                  </div>
                </div>

                <div className="p-2.5 bg-cyan-50/90 rounded-xl border border-cyan-200">
                  <label className="text-[10px] font-black uppercase text-cyan-800 block mb-1 flex items-center gap-1">
                    <Ruler size={11} /> Taille (Optionnelle)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="1"
                      min="30"
                      max="250"
                      value={patientHeight}
                      onChange={(e) => setPatientHeight(e.target.value)}
                      placeholder="Ex: 175"
                      className="w-full p-1.5 bg-white border border-cyan-300 rounded-lg font-black text-sm text-cyan-950 outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                    />
                    <span className="text-xs font-bold text-cyan-800 shrink-0">cm</span>
                  </div>
                </div>

                <div className="p-2.5 bg-indigo-50/90 rounded-xl border border-indigo-200 flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase text-indigo-800 block mb-0.5">
                    IMC Calculé
                  </span>
                  {imcData ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-indigo-950">{imcData.val}</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-200/80 text-indigo-900">
                        {imcData.cat}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400 italic">Poids & taille requis</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-red-50/80 rounded-xl border border-red-200">
                <p className="text-[10px] font-black uppercase text-red-600 mb-0.5">Groupe Sanguin</p>
                <p className="text-sm font-black text-red-800">{patientInfo?.bloodGroup || 'Non renseigné'}</p>
              </div>
              <div className="p-3 bg-orange-50/80 rounded-xl border border-orange-200">
                <p className="text-[10px] font-black uppercase text-orange-600 mb-0.5">Allergies Connues</p>
                <p className={`text-xs font-bold ${patientInfo?.allergies ? 'text-red-700 bg-red-100/60 p-1 rounded' : 'text-slate-700'}`}>
                  {patientInfo?.allergies || 'Aucune allergie connue'}
                </p>
              </div>
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200">
                <p className="text-[10px] font-black uppercase text-blue-600 mb-0.5">Antécédents Médicaux</p>
                <p className="text-xs font-bold text-slate-700">
                  {patientInfo?.medicalHistory || 'Aucun antécédent médical'}
                </p>
              </div>
              <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200">
                <p className="text-[10px] font-black uppercase text-purple-600 mb-0.5">Antécédents Familiaux</p>
                <p className="text-xs font-bold text-slate-700">
                  {patientInfo?.familyHistory || 'Aucun antécédent familial'}
                </p>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-100/60 transition-colors">
              <input
                type="checkbox"
                checked={checkedAntecedents}
                onChange={(e) => setCheckedAntecedents(e.target.checked)}
                className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <CheckSquare size={16} className="text-amber-700 shrink-0" />
                J'atteste avoir vérifié les antécédents et contre-indications du patient pour cette prescription.
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-indigo-800 uppercase tracking-wider mb-3">
                Médicaments
              </label>
              <textarea
                name="medicationPrescription"
                value={formData.medicationPrescription}
                onChange={handleChange}
                className="w-full p-5 bg-white border border-indigo-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all shadow-sm font-medium text-slate-700"
                rows={4}
                placeholder="Ex: Amoxicilline 1g - 2x/jour pendant 6 jours..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-indigo-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TestTube size={16} /> Demande d’Examen Médical
              </label>
              <textarea
                name="labPrescription"
                value={formData.labPrescription}
                onChange={handleChange}
                className="w-full p-5 bg-white border border-indigo-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all shadow-sm font-medium text-slate-700"
                rows={4}
                placeholder="Ex: NFS complète, Bilan hépatique, Radiographie pulmonaire..."
              />
            </div>
          </div>
        </div>

        {consultationId && (
          <p className="text-sm text-indigo-800 bg-indigo-100 p-4 rounded-xl mt-4 font-medium">
            Note : Les prescriptions de médicaments et d'examens médicaux ne peuvent pas être modifiées une fois créées pour des raisons de sécurité médicale.
          </p>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
          <label className="flex items-center gap-4 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={formData.sickLeave}
                onChange={handleCheckboxChange}
                className="peer appearance-none w-8 h-8 border-2 border-slate-300 rounded-xl checked:bg-amber-500 checked:border-amber-500 transition-colors cursor-pointer"
              />
              <span className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">✓</span>
            </div>
            <span className="font-bold text-lg text-slate-700 group-hover:text-amber-600 transition-colors">Arrêt de travail</span>
          </label>

          <div className="flex-1 w-full border-l-0 md:border-l-2 border-slate-200 md:pl-8">
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Note de référence</label>
            <input
              name="referralNote"
              value={formData.referralNote}
              onChange={handleChange}
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all shadow-sm font-medium"
              placeholder="Orientation vers un spécialiste..."
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Activity className="animate-spin" size={28} />
                Enregistrement en cours...
              </>
            ) : (
              <>
                <Send size={28} />
                {consultationId ? 'Enregistrer les modifications' : 'Terminer la consultation'}
              </>
            )}
          </button>
          {!checkedAntecedents && (
            <p className="text-xs sm:text-sm text-amber-900 font-bold text-center bg-amber-50 py-3 px-4 rounded-2xl border-2 border-amber-300 shadow-sm animate-pulse flex items-center justify-center gap-2">
              <ShieldAlert size={18} className="text-amber-700 shrink-0" />
              <span>Veuillez cocher l'attestation : <em>« J'atteste avoir vérifié les antécédents et contre-indications du patient pour cette prescription »</em> pour débloquer le bouton Terminer.</span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}