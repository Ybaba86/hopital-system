import { useEffect, useState } from 'react';
import { Users, Phone, Search, UserCircle2, FolderOpen } from 'lucide-react';
import api from '../services/api';
import DossierMedicalModal from '../components/DossierMedicalModal';

export default function CarnetMedical() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDossier, setShowDossier] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      const res = await api.get('/patients');
      setPatients(res.data);
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">Carnet Médical (Lecture seule)</h1>
        <p className="text-slate-500 mt-2 font-medium">Consultez l'historique médical des patients et anciens résultats d'analyse.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Liste Patients */}
        <div className="w-full md:w-1/3">
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher un patient..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {filteredPatients.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedPatient(p)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4
                  ${selectedPatient?.id === p.id 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                    : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-700'}`}
              >
                <UserCircle2 size={32} className={selectedPatient?.id === p.id ? 'text-white' : 'text-slate-300'} />
                <div>
                  <p className="font-bold">{p.firstName} {p.lastName}</p>
                  <p className={`text-xs flex items-center gap-1 ${selectedPatient?.id === p.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                    <Phone size={12} /> {p.phone}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-grow">
          {selectedPatient ? (
            <div className="bg-white p-12 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center h-full">
              <FolderOpen size={64} className="text-emerald-100 mb-6" />
              <h3 className="text-2xl font-bold mb-2">Dossier de {selectedPatient.firstName} {selectedPatient.lastName}</h3>
              <p className="text-slate-500 mb-8 max-w-md">Vous pouvez consulter l'historique complet de ce patient (consultations, ordonnances, et résultats de laboratoire).</p>
              
              <button
                onClick={() => setShowDossier(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200"
              >
                <FolderOpen size={20} />
                Ouvrir le dossier médical
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center text-slate-400">
              <Users size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Sélectionnez un patient pour consulter son historique</p>
            </div>
          )}
        </div>
      </div>

      {showDossier && selectedPatient && (
        <DossierMedicalModal
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
          onClose={() => setShowDossier(false)}
        />
      )}
    </div>
  );
}
