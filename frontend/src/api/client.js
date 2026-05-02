import axios from 'axios';

//Configuración base de Axios
//Centraliza las peticiones HTTP hacia la API
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Agrega automáticamente el token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Maneja errores globales de autenticación y permisos
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url    = err.config?.url;
    const msg    = err.response?.data?.message || '';

    // Log detallado para depuración
    if (status === 403) {
      console.warn(`[403 Forbidden] ${url} — ${msg}`);
    }

    // Redirección automática si el token expira
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;