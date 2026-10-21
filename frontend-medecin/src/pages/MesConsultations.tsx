import { useEffect, useState } from 'react';
import { FileText, Search, Trash2, Eye, Loader2, X } from 'lucide-react';
import api from '../services/api';

export default function MesConsultations() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  
  // Pour la modal de détails
  const [selectedConsult, setSelectedConsult] = useState<any>(null);

  // Récupérer le rôle
  useEffect(() => {
    const medecinData = localStorage.getItem('medecin');
    if (medecinData) {
      const parsed = JSON.parse(medecinData);
      setUserRole(parsed.role || '');
    }
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await api.get('/consultations');
      const doctorData = JSON.parse(localStorage.getItem('medecin') || '{}');
      
      const myConsults = res.data.filter((c: any) => c.doctor.id === doctorData.id);
      setConsultations(myConsults);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const filteredConsultations = consultations.filter(c =>
    `${c.patient.firstName} ${c.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Annuler (seulement ADMIN)
  const handleCancel = async (consultId: string) => {
    if (!confirm('Voulez-vous vraiment annuler cette consultation ? Cette action est irréversible.')) return;
    try {
      await api.delete(`/consultations/${consultId}`);
      alert('Consultation annulée avec succès');
      fetchConsultations();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erreur lors de l\'annulation');
    }
  };

  const openDetails = (consult: any) => {
    setSelectedConsult(consult);
  };

  const closeDetails = () => {
    setSelectedConsult(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-3 sm:p-6 md:p-8 animate-in fade-in duration-500 min-h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-10 gap-4 sm:gap-6 shrink-0">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black flex items-center gap-3 sm:gap-4 text-slate-800">
            <div className="bg-indigo-100 p-2 sm:p-3 rounded-2xl text-indigo-600">
              <FileText className="w-6 h-6 sm:w-9 sm:h-9" />
            </div>
            Mes Consultations
          </h2>
          <p className="text-slate-500 text-sm sm:text-lg mt-1 sm:mt-2 font-medium">Historique de vos consultations médicales.</p>
        </div>

        <div className="relative w-full md:w-96 group shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Rechercher un patient ou diagnostic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm font-medium text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-white overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left min-w-[650px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-4 sm:px-8 py-4 sm:py-6 font-bold text-slate-500 uppercase tracking-wider text-xs sm:text-sm">Date</th>
                <th className="px-4 sm:px-8 py-4 sm:py-6 font-bold text-slate-500 uppercase tracking-wider text-xs sm:text-sm">Patient</th>
                <th className="px-4 sm:px-8 py-4 sm:py-6 font-bold text-slate-500 uppercase tracking-wider text-xs sm:text-sm">Téléphone</th>
                <th className="px-4 sm:px-8 py-4 sm:py-6 font-bold text-slate-500 uppercase tracking-wider text-xs sm:text-sm">Diagnostic</th>
                <th className="px-4 sm:px-8 py-4 sm:py-6 font-bold text-slate-500 uppercase tracking-wider text-xs sm:text-sm text-center">Prescriptions</th>
                <th className="px-4 sm:px-8 py-4 sm:py-6 font-bold text-slate-500 uppercase tracking-wider text-xs sm:text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 sm:py-24">
                    <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 text-lg font-medium">Aucune consultation trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredConsultations.map((consult: any) => (
                  <tr key={consult.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                      <div className="font-black text-slate-800 text-sm sm:text-base">
                        {new Date(consult.date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
                        {new Date(consult.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                      <span className="font-bold text-base sm:text-lg text-slate-800">
                        {consult.patient.firstName} {consult.patient.lastName}
                      </span>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-slate-500 font-medium text-sm">
                      {consult.patient.phone || '—'}
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-slate-600 font-medium max-w-xs truncate text-sm">
                      {consult.diagnosis || 'Non renseigné'}
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-center">
                      <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl font-bold border border-indigo-100 text-xs sm:text-sm">
                        {consult.prescriptions?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openDetails(consult)}
                          className="flex items-center gap-1.5 sm:gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-colors font-bold text-xs sm:text-sm"
                          title="Voir dossier"
                        >
                          <Eye size={16} />
                          Voir
                        </button>

                        {userRole === 'ADMIN' && (
                          <button
                            onClick={() => handleCancel(consult.id)}
                            className="flex items-center gap-1.5 sm:gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-colors font-bold text-xs sm:text-sm"
                            title="Annuler"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DÉTAILS CONSULTATION */}
      {selectedConsult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto border border-white">
            <div className="p-4 sm:p-8 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-md z-10 flex justify-between items-center">
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
                <FileText className="text-indigo-600" />
                Détails de la consultation
              </h3>
              <button
                onClick={closeDetails}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Patient</p>
                  <p className="text-2xl font-black text-slate-800">
                    {selectedConsult.patient.firstName} {selectedConsult.patient.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Médecin</p>
                  <p className="text-xl font-bold text-indigo-700">Dr. {selectedConsult.doctor.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Renseignement Clinique (Motif de la consultation)</h4>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl text-slate-700 font-medium">
                    {selectedConsult.symptoms || 'Non renseigné'}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Diagnostic</h4>
                  <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl text-indigo-900 font-bold">
                    {selectedConsult.diagnosis || 'Non renseigné'}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Traitements Médicales (Prescription)</h4>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl text-slate-700 font-medium">
                  {selectedConsult.treatment || 'Aucun traitement médical prescrit'}
                </div>
              </div>

              {selectedConsult.sickLeave && (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-amber-700 font-black flex items-center gap-3">
                  <span className="text-2xl">⚠️</span> Arrêt de travail prescrit
                </div>
              )}

              {selectedConsult.referralNote && (
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Note de référence</h4>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl text-slate-700 font-medium italic">
                    "{selectedConsult.referralNote}"
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  Prescriptions
                  <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-lg text-xs">
                    {selectedConsult.prescriptions?.length || 0}
                  </span>
                </h4>
                {selectedConsult.prescriptions && selectedConsult.prescriptions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedConsult.prescriptions.map((p: any) => (
                      <div key={p.id} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:shadow-md transition-shadow">
                        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-lg mb-3">
                          {p.type === 'medication' ? '💊 Médicament' : '🔬 Analyse'}
                        </span>
                        <p className="font-bold text-slate-700">{p.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 font-medium italic">Aucune prescription rattachée à cette consultation.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}