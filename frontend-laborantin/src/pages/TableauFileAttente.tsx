import { useEffect, useState } from 'react';
import { UserCheck } from 'lucide-react';
import api from '../services/api';

export default function TableauFileAttente() {
  const [waiting, setWaiting] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black flex items-center gap-3">
          <UserCheck className="text-emerald-600" size={32} />
          File d’attente actuelle
        </h2>
        <span className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-3xl font-bold text-lg">
          {waiting.length} patient{waiting.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-8 py-5 text-left">Ticket</th>
              <th className="px-8 py-5 text-left">Patient</th>
              <th className="px-8 py-5 text-left">Médecin</th>
              <th className="px-8 py-5 text-center">Statut</th>
              <th className="px-8 py-5 text-left">Heure</th>
            </tr>
          </thead>
          <tbody>
            {waiting.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-slate-400">
                  Aucune personne en file d’attente pour le moment
                </td>
              </tr>
            ) : (
              waiting.map((t: any) => (
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
  );
}