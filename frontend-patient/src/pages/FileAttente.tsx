import { useEffect, useState, useRef } from 'react';
import { Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function FileAttente() {
  const [position, setPosition] = useState<number | null>(null);
  const [status, setStatus] = useState<'waiting' | 'in_progress' | 'completed'>('waiting');
  const [doctorName, setDoctorName] = useState<string>('');
  const [queueType, setQueueType] = useState<string>('consultation');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef<number | null>(null);

  const patient = JSON.parse(localStorage.getItem('patient') || '{}');

  const fetchPosition = async () => {
    if (!patient.id) return;

    try {
      const res = await api.get(`/queue/position/${patient.id}`);
      setPosition(res.data.position);
      setStatus(res.data.status || 'waiting');
      setDoctorName(res.data.doctorName || 'votre médecin');
      setQueueType(res.data.queueType || 'consultation');
      setError('');
    } catch (err: any) {
      if (err.response?.status === 404) {
        setPosition(null);
        setStatus('waiting');
        setError('');
        // On ne tue pas l'intervalle pour qu'il reprenne automatiquement si on l'ajoute à la file
      } else {
        setError('Impossible de récupérer votre position');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosition();
    intervalRef.current = setInterval(fetchPosition, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [patient.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
        <Users className="text-blue-600" /> Votre position dans la file
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 text-amber-700 rounded-3xl flex items-center gap-3">
          <AlertCircle /> {error}
        </div>
      )}

      {status === 'in_progress' && (
        <div className="bg-emerald-100 border-2 border-emerald-500 p-10 rounded-3xl text-center">
          <CheckCircle className="mx-auto text-emerald-600 mb-6" size={80} />
          <p className="text-4xl font-black text-emerald-700 mb-2">C’EST VOTRE TOUR !</p>
          <p className="text-xl text-emerald-600">
            {queueType === 'laboratory' 
              ? "Veuillez vous présenter au laboratoire pour votre prélèvement." 
              : `Allez chez le médecin ${doctorName}`
            }
          </p>
        </div>
      )}

      {status === 'waiting' && position !== null && (
        <div className="bg-white p-8 rounded-3xl border shadow-sm text-center">
          <div className="text-7xl font-black text-blue-600 mb-4">{position}</div>
          <p className="text-xl font-medium">Personnes devant vous</p>
          <p className="text-slate-500 mt-2">Patientez, votre tour arrive bientôt.</p>
        </div>
      )}

      {status === 'waiting' && position === null && (
        <div className="bg-white p-8 rounded-3xl border text-center">
          <Clock className="mx-auto text-blue-400 mb-4" size={60} />
          <p className="text-xl font-medium">Aucune file d’attente active</p>
          <p className="text-slate-500 mt-2">Vous n’avez pas de rendez-vous en cours ou la file est vide.</p>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-slate-400">
        Cette page se rafraîchit automatiquement.
      </div>
    </div>
  );
}