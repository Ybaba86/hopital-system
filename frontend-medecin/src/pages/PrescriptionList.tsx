import { useEffect, useState } from 'react';
import { FileText, Calendar, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '../services/api';

interface Prescription {
  id: string;
  type: string;
  content: string;
  qrCode?: string;
  consultation: {
    date: string;
    patient: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function PrescriptionList() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fake fetch for compilation sake, or real fetch
    api.get('/prescriptions').then(res => {
      setPrescriptions(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12">Chargement des prescriptions...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
        <FileText className="text-indigo-600" size={32} /> Prescriptions Émises
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {prescriptions.map(p => (
          <div key={p.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FileText size={20}/></div>
                <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Download size={20}/></button>
              </div>
              
              <div className="space-y-2 mb-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Patient</p>
                <h3 className="text-xl font-black text-slate-900">{p.consultation.patient.firstName} {p.consultation.patient.lastName}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Calendar size={14}/> {new Date(p.consultation.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Prescription ({p.type})</p>
                <p className="text-slate-700 italic font-medium leading-relaxed">"{p.content}"</p>
              </div>
            </div>

            {p.qrCode && (
              <div className="bg-slate-900 p-6 flex items-center gap-6">
                <div className="bg-white p-2 rounded-xl">
                  <QRCode value={`http://localhost:3000/api/consultations/prescription/qr/${p.qrCode}`} size={80} />
                </div>
                <div className="text-white">
                  <p className="text-sm font-bold opacity-100">Validation Numérique</p>
                  <p className="text-[11px] opacity-50 leading-tight mt-1">Ce code permet au patient de récupérer son traitement en pharmacie.</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}