import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginCaissier from './pages/LoginCaissier';
import DashboardCaisse from './pages/DashboardCaisse';
import PaiementEtTicket from './pages/PaiementEtTicket';
import TableauFileAttente from './pages/TableauFileAttente';
import LaboratoireCaisse from './pages/LaboratoireCaisse';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import ConsultationsTerminees from './pages/ConsultationsTerminees';
import MouvementsCaisse from './pages/MouvementsCaisse';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 lg:overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto w-full flex flex-col">
        <div className="w-full lg:w-[85%] xl:w-[80%] mx-auto py-3 sm:py-6 px-2 sm:px-4 flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '1rem', background: '#fff', color: '#334155' } }} />
      <Routes>
        <Route path="/login" element={<LoginCaissier />} />
        <Route path="/dashboard" element={<Layout><DashboardCaisse /></Layout>} />
        <Route path="/paiement" element={<Layout><PaiementEtTicket /></Layout>} />
        <Route path="/labo" element={<Layout><LaboratoireCaisse /></Layout>} />
        <Route path="/file-attente" element={<Layout><TableauFileAttente /></Layout>} />
        <Route path="/mouvements" element={<Layout><MouvementsCaisse /></Layout>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/consultations-terminees" element={<Layout><ConsultationsTerminees /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;