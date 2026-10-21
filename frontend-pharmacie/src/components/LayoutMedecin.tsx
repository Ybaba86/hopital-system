import { Outlet, Link, useNavigate } from 'react-router-dom';

export default function LayoutMedecin() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('medecinToken');
    localStorage.removeItem('medecin');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Espace Médecin</h1>
        <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded">Déconnexion</button>
      </header>
      <nav className="bg-white shadow p-2 flex gap-4 justify-center">
        <Link to="/dashboard" className="text-blue-700">Dashboard</Link>
        <Link to="/rendez-vous" className="text-blue-700">Rendez-vous</Link>
        <Link to="/patients" className="text-blue-700">Patients</Link>
      </nav>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}