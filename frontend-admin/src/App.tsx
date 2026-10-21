import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginAdmin from './pages/LoginAdmin';
import RegisterAdmin from './pages/RegisterAdmin';
import DashboardAdmin from './pages/DashboardAdmin';
import HospitalsManager from './pages/HospitalsManager';
import UsersManager from './pages/UsersManager';
import DoctorsManager from './pages/DoctorsManager';
import ServicesManager from './pages/ServicesManager';
import PatientsManager from './pages/PatientsManager';
import Reports from './pages/Reports';
import PharmaciesManager from './pages/PharmaciesManager';
import LaboratoriesManager from './pages/LaboratoriesManager';
import LayoutAdmin from './components/LayoutAdmin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" />} />
        <Route path="/admin/login" element={<LoginAdmin />} />
        <Route path="/admin/register" element={<RegisterAdmin />} />
        <Route element={<LayoutAdmin />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
          <Route path="/admin/dashboard" element={<DashboardAdmin />} />
          <Route path="/admin/hospitals" element={<HospitalsManager />} />
          <Route path="/admin/services" element={<ServicesManager />} />
          <Route path="/admin/doctors" element={<DoctorsManager />} />
          <Route path="/admin/users" element={<UsersManager />} />
          <Route path="/admin/patients" element={<PatientsManager />} />
          <Route path="/admin/pharmacies" element={<PharmaciesManager />} />
          <Route path="/admin/laboratories" element={<LaboratoriesManager />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;