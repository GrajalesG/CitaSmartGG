import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/Applayout';

// Páginas del sistema
import LoginPage       from './pages/auth/LoginPage';
import DashboardPage   from './pages/dashboard/DashboardPage';
import CitasPage       from './pages/citas/CitasPage';
import NuevaCitaPage   from './pages/citas/NuevaCitaPage';
import CalendarioPage  from './pages/citas/CalendarioPage';
import PacientesPage   from './pages/pacientes/PacientesPage';
import ProfesionalesPage from './pages/profesionales/ProfesionalesPage';
import ServiciosPage   from './pages/servicios/ServiciosPage';
import HorariosPage    from './pages/horarios/HorariosPage';
import UsuariosPage    from './pages/usuarios/UsuariosPage';

//Componente para proteger rutas privadas
//Valida autenticación y permisos por rol
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"/>
    </div>
  );
   // Si no hay usuario autenticado → login
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
};

// Roles del sistema
const STAFF = ['admin', 'personal'];   // roles con acceso a profesionales/servicios/horarios
const ADMIN = ['admin'];

//Configuración principal de rutas de la aplicación
const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="citas" element={<CitasPage />} />
          <Route path="citas/nueva" element={<NuevaCitaPage />} />
          <Route path="citas/calendario" element={<CalendarioPage />} />
          <Route path="pacientes" element={<PacientesPage />} />
          <Route path="profesionales" element={<PrivateRoute roles={STAFF}><ProfesionalesPage /></PrivateRoute>} />
          <Route path="servicios"     element={<PrivateRoute roles={STAFF}><ServiciosPage /></PrivateRoute>} />
          <Route path="horarios"      element={<PrivateRoute roles={STAFF}><HorariosPage /></PrivateRoute>} />
           {/* Administración de usuarios (solo admin) */}
          <Route path="usuarios"      element={<PrivateRoute roles={ADMIN}><UsuariosPage /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;