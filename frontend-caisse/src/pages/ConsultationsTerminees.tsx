import { useEffect, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import api from '../services/api';

export default function ConsultationsTerminees() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const res = await api.get('/consultations');
        // Trier par date décroissante (les plus récentes en premier)
        const sorted = res.data.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setConsultations(sorted);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultations();
  }, []);

  const filtered = consultations.filter(c =>
    `${c.patient.firstName} ${c.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-12">Chargement des consultations...</div>;

  return (
    <div className="w-full mx-auto p-2 sm:p-6 flex-1 flex flex-col min-h-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 flex-shrink-0">
        <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <FileText className="text-emerald-600" size={28} />
          Consultations Terminées
        </h2>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un patient ou diagnostic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full relative min-w-[600px]">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-8 py-5 text-left">Date</th>
              <th className="px-8 py-5 text-left">Patient</th>
              <th className="px-8 py-5 text-left">Médecin</th>
              <th className="px-8 py-5 text-left">Diagnostic</th>
              <th className="px-8 py-5 text-center">Prescriptions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-slate-400">
                  Aucune consultation terminée trouvée
                </td>
              </tr>
            ) : (
              filtered.map((consult: any) => (
                <tr key={consult.id} className="hover:bg-slate-50">
                  <td className="px-8 py-6">
                    <div className="font-medium">
                      {new Date(consult.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(consult.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-8 py-6 font-semibold">
                    {consult.patient.firstName} {consult.patient.lastName}
                  </td>
                  <td className="px-8 py-6 text-slate-600">
                    Dr. {consult.doctor.name}
                  </td>
                  <td className="px-8 py-6 text-slate-700 max-w-xs truncate">
                    {consult.diagnosis || 'Non renseigné'}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-3xl text-sm font-medium">
                      {consult.prescriptions?.length || 0}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}