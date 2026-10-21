import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('laborantinToken') || localStorage.getItem('caisseToken') || localStorage.getItem('adminToken') || localStorage.getItem('medecinToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Injecter l'ID de l'hôpital si présent dans le profil de l'utilisateur (caisse ou medecin)
  const userStr = localStorage.getItem('caisse') || localStorage.getItem('medecin');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.hospitalId) {
        config.params = { ...config.params, hospitalId: user.hospitalId };
      }
    } catch (e) {}
  }
  
  return config;
});

export default api;