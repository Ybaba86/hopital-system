import { useEffect, useState } from 'react';
import { Users, Phone, Search, UserCircle2, FolderOpen } from 'lucide-react';
import api from '../services/api';
import ConsultationForm from './ConsultationForm';
import DossierMedicalModal from './DossierMedicalModal';

export default function PatientsList() {
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
    <div className="max-w-7xl mx-auto w-full p-3 sm:p-6 min-h-full flex flex-col">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1 min-h-0">
        {/* Liste Patients */}
        <div className="w-full md:w-1/3 flex flex-col max-h-[340px] md:max-h-none md:h-full overflow-hidden shrink-0">
          <div className="mb-4 sm:mb-6 relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher un patient..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm sm:text-base" />
          </div>

          <div className="space-y-2.5 sm:space-y-3 flex-1 overflow-y-auto pr-1 sm:pr-2">
            {filteredPatients.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedPatient(p)}
                className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 sm:gap-4
                  ${selectedPatient?.id === p.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                    : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700'}`}
              >
                <UserCircle2 size={30} className={selectedPatient?.id === p.id ? 'text-white' : 'text-slate-300'} />
                <div className="min-w-0">
                  <p className="font-bold text-sm sm:text-base truncate">
                    {p.firstName} {p.lastName} {p.age ? `(${p.age} ans)` : ''}
                  </p>
                  <p className={`text-xs flex items-center gap-1 ${selectedPatient?.id === p.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    <Phone size={12} /> {p.phone || 'Non renseigné'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto min-h-0 pr-1 sm:pr-2">
          {selectedPatient ? (
            <div className="space-y-6">
              <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <span>Dossier de {selectedPatient.firstName} {selectedPatient.lastName}</span>
                    {selectedPatient.age && (
                      <span className="text-xs font-black bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                        {selectedPatient.age} ans
                      </span>
                    )}
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                    {selectedPatient.phone ? `Tél: ${selectedPatient.phone}` : ''}
                    {selectedPatient.weight ? ` • Poids: ${selectedPatient.weight} kg` : ''}
                    {selectedPatient.height ? ` • Taille: ${selectedPatient.height} cm` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowDossier(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base"
                >
                  <FolderOpen size={18} />
                  Ouvrir le dossier complet
                </button>
              </div>

              <ConsultationForm patientId={selectedPatient.id} patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`} onSuccess={() => {
                setSelectedPatient(null);
                alert('Consultation terminée');
              }} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center text-slate-400">
              <Users size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Sélectionnez un patient pour démarrer la consultation</p>
            </div>
          )}
        </div>
      </div>

      {showDossier && selectedPatient && (
        <DossierMedicalModal
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
          onClose={() => setShowDossier(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}