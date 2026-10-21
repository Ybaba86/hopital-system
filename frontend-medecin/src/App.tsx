import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardMedecin from './pages/DashboardMedecin';
import PatientsList from './pages/PatientsList';
import RendezVousMedecin from './pages/RendezVousMedecin';
import FileAttenteMedecin from './pages/FileAttenteMedecin';
import MesConsultations from './pages/MesConsultations';
import BoiteReceptionLabo from './pages/BoiteReceptionLabo';
import LoginMedecin from './pages/LoginMedecin';
import MesDisponibilites from './pages/MesDisponibilites';

function App() {
  const isAuthenticated = !!localStorage.getItem('medecinToken');

  return (
    <Router>
      <div className="min-h-screen lg:h-screen bg-slate-50 flex flex-col lg:overflow-hidden">
        {/* Navbar visible uniquement si connecté */}
        {isAuthenticated && <Navbar />}

        <div className="flex-1 overflow-y-auto flex flex-col p-2 sm:p-4">
          <Routes>
            <Route path="/login" element={<LoginMedecin />} />

            {/* Routes protégées */}
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <DashboardMedecin /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/patients" 
              element={isAuthenticated ? <PatientsList /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/appointments" 
              element={isAuthenticated ? <RendezVousMedecin /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/file-attente" 
              element={isAuthenticated ? <FileAttenteMedecin /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/consultations" 
              element={isAuthenticated ? <MesConsultations /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/labo" 
              element={isAuthenticated ? <BoiteReceptionLabo /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/disponibilites" 
              element={isAuthenticated ? <MesDisponibilites /> : <Navigate to="/login" />} 
            />

            {/* Redirection par défaut */}
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;