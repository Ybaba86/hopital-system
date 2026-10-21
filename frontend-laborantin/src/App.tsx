import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginLaborantin from './pages/LoginLaborantin';
import DashboardLaborantin from './pages/DashboardLaborantin';
import CarnetMedical from './pages/CarnetMedical';
import ArchivesLabo from './pages/ArchivesLabo';
import ScannerLabo from './pages/ScannerLabo';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
        {children}
      </main>
    </>
  );
}

function App() {
  const isAuthenticated = !!localStorage.getItem('laborantinToken');

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '1rem', background: '#fff', color: '#334155' } }} />
      <Routes>
        <Route path="/login" element={<LoginLaborantin />} />
        <Route path="/dashboard" element={isAuthenticated ? <Layout><DashboardLaborantin /></Layout> : <Navigate to="/login" />} />
        <Route path="/carnet" element={isAuthenticated ? <Layout><CarnetMedical /></Layout> : <Navigate to="/login" />} />
        <Route path="/archives" element={isAuthenticated ? <Layout><ArchivesLabo /></Layout> : <Navigate to="/login" />} />
        <Route path="/scanner" element={isAuthenticated ? <Layout><ScannerLabo /></Layout> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;