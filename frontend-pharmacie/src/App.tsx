import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPharmacien from './pages/LoginPharmacien';
import DashboardPharmacie from './pages/DashboardPharmacie';
import ScannerOrdonnance from './pages/ScannerOrdonnance';
import GestionStock from './pages/GestionStock';
import CarnetPatient from './pages/CarnetPatient';
import MouvementsPharmacie from './pages/MouvementsPharmacie';

function App() {
  const isAuthenticated = !!localStorage.getItem('pharmacienToken');

  return (
    <Router>
      <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 lg:overflow-hidden">
        {isAuthenticated && <Navbar />}

        <main className="flex-1 overflow-y-auto w-full flex flex-col">
          <div className="w-full py-4 sm:py-6 px-2 sm:px-4 flex-1 flex flex-col min-h-0">
          <Routes>
            <Route path="/login" element={<LoginPharmacien />} />

            {/* Routes protégées */}
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <DashboardPharmacie /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/scanner" 
              element={isAuthenticated ? <ScannerOrdonnance /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/stock" 
              element={isAuthenticated ? <GestionStock /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/patients" 
              element={isAuthenticated ? <CarnetPatient /> : <Navigate to="/login" />} 
            />

            <Route 
              path="/mouvements" 
              element={isAuthenticated ? <MouvementsPharmacie /> : <Navigate to="/login" />} 
            />

            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;