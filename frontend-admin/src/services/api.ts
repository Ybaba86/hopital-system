import axios from 'axios';

const envUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
export const API_BASE_URL = envUrl.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: envUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;