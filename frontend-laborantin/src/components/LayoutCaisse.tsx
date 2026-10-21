import { Outlet, Link, useNavigate } from 'react-router-dom';

export default function LayoutCaisse() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('caisseToken');
    localStorage.removeItem('caissier');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-700 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Caisse - Hôpital</h1>
        <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded">Déconnexion</button>
      </header>
      <nav className="bg-white shadow p-2 flex gap-4 justify-center">
        <Link to="/dashboard" className="text-green-700">Dashboard</Link>
        <Link to="/paiement" className="text-green-700">Paiement + Ticket</Link>
        <Link to="/file-attente" className="text-green-700">File d'attente</Link>
      </nav>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}