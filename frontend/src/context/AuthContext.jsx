import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/services';

//Contexto de autenticación
//Permite compartir el estado del usuario autenticado en toda la app
const AuthContext = createContext(null);

//Provider principal de autenticación
export const AuthProvider = ({ children }) => {
  // // Usuario autenticado
  const [user, setUser] = useState(null);
  //// Estado de carga inicial
  const [loading, setLoading] = useState(true);

  //Verificar sesión al cargar la aplicación
  useEffect(() => {
    const token = localStorage.getItem('token');
    // // Si no existe token, finalizar carga
    if (!token) { setLoading(false); return; }
    //Obtener información del usuario autenticado
    authApi.me()
      .then(r => setUser(r.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  //Iniciar sesión
  const login = useCallback(async (email, password) => {
    const r = await authApi.login({ email, password });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  }, []);

  // Cerrar sesión
  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);