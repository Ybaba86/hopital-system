import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPatient from './pages/LoginPatient';
import RegisterPatient from './pages/RegisterPatient';
import DashboardPatient from './pages/DashboardPatient';
import RendezVousPatient from './pages/RendezVousPatient';
import OrdonnancesPatient from './pages/OrdonnancesPatient';
import ResultatsLabo from './pages/ResultatsLabo';
import TakeAppointment from './pages/TakeAppointment';
import FileAttente from './pages/FileAttente';
import CarnetMedical from './pages/CarnetMedical';
import MesRecus from './pages/MesRecus';
import LayoutPatient from './components/LayoutPatient';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '1rem', background: '#fff', color: '#334155' } }} />
      <Routes>
        <Route path="/login" element={<LoginPatient />} />
        <Route path="/register" element={<RegisterPatient />} />
        <Route element={<PrivateRoute />}>
          <Route element={<LayoutPatient />}>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPatient />} />
            <Route path="/rendez-vous" element={<RendezVousPatient />} />
            <Route path="/ordonnances" element={<OrdonnancesPatient />} />
            <Route path="/resultats" element={<ResultatsLabo />} />
            <Route path="/take-appointment" element={<TakeAppointment />} />
            <Route path="/file-attente" element={<FileAttente />} />
            <Route path="/carnet" element={<CarnetMedical />} />
            <Route path="/recus" element={<MesRecus />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;