import { Navigate, Outlet } from 'react-router-dom';

export default function PrivateRoute() {
  const token = localStorage.getItem('medecinToken');
  return token ? <Outlet /> : <Navigate to="/login" />;
}