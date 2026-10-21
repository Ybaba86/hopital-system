import { useEffect, useState } from 'react';
import { UserCheck, Search } from 'lucide-react';
import api from '../services/api';

export default function TableauFileAttente() {
  const [waiting, setWaiting] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchQueue = async () => {
    try {
      const res = await api.get('/queue/waiting');
      setWaiting(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // rafraîchit toutes les 5 secondes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <p className="text-center py-10">Chargement de la file d’attente...</p>;
  }

  const filteredWaiting = waiting.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const patientName = `${t.patient.firstName} ${t.patient.lastName}`.toLowerCase();
    const ticketNumber = t.ticketNumber.toString();
    return patientName.includes(term) || ticketNumber.includes(term);
  });

  return (
    <div className="w-full mx-auto flex-1 flex flex-col min-h-0 p-1 sm:p-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4 flex-shrink-0">
        <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <UserCheck className="text-emerald-600" size={28} />
          File d’attente actuelle
        </h2>
        <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher patient, N°..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>
          <span className="bg-emerald-100 text-emerald-700 px-4 sm:px-6 py-2 rounded-3xl font-bold text-sm sm:text-lg whitespace-nowrap">
            {filteredWaiting.length} patient{filteredWaiting.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full relative min-w-[600px]">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-8 py-5 text-left">Ticket</th>
                <th className="px-8 py-5 text-left">Patient</th>
                <th className="px-8 py-5 text-left">Médecin</th>
                <th className="px-8 py-5 text-center">Statut</th>
                <th className="px-8 py-5 text-left">Heure</th>
              </tr>
            </thead>
          <tbody>
            {filteredWaiting.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-slate-400">
                  Aucune personne en file d’attente pour cette recherche
                </td>
              </tr>
            ) : (
              filteredWaiting.map((t: any) => (
                <tr key={t.id} className="border-t hover:bg-slate-50">
                  <td className="px-8 py-6">
                    <span className="font-black text-3xl text-emerald-600">#{t.ticketNumber}</span>
                    {t.isEmergency && <span className="ml-3 text-red-500 text-xs font-bold">🚨 URGENT</span>}
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-semibold">{t.patient.firstName} {t.patient.lastName}</p>
                  </td>
                  <td className="px-8 py-6 text-slate-600">
                    {t.appointment?.doctor?.name || '—'}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-5 py-2 bg-amber-100 text-amber-700 rounded-3xl text-sm font-bold">
                      En attente
                    </span>
                  </td>
                  <td className="px-8 py-6 text-slate-500">
                    {t.createdAt ? new Date(t.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
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