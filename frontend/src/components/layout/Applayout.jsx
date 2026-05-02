import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../../assets/logosmall.png';

//Navegación principal del sistema
const NAV = [
  { to: '/',                 label: 'Dashboard',      exact: true },
  { to: '/citas/calendario', label: 'Calendario' },
  { to: '/citas',            label: 'Citas' },
  { to: '/pacientes',        label: 'Pacientes' },
  { to: '/profesionales',    label: 'Profesionales',  roles: ['admin', 'personal'] },
  { to: '/servicios',        label: 'Servicios',      roles: ['admin', 'personal'] },
  { to: '/horarios',         label: 'Horarios',       roles: ['admin', 'personal'] },
];

// Navegación exclusiva para administradores
const ADMIN_NAV = [
  { to: '/usuarios', label: 'Usuarios' },
];

//Layout principal de la aplicación
export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  //Cerrar sesión del sistema
  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };
//Cerrar menú desplegable al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  //Filtrar opciones de navegación según el rol
  const allNav = [
    ...NAV.filter(({ roles }) => !roles || roles.includes(user?.rol)),
    ...(isAdmin ? ADMIN_NAV : []),
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">

       {/* Barra superior de navegación */}
      <header className="bg-white border-b border-slate-200 shrink-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 flex items-center h-14 gap-1">

        {/* Logo del sistema */}
          <NavLink to="/" className="flex items-center gap-2 mr-6 shrink-0">
           <div className="w-50 h-50 md:w-58 md:h-58 object-contain">
                       <img src={logo} alt="Logo" className="w-50 h-50 object-contain" />
                     </div>
            <span className="font-bold text-slate-800 text-base tracking-tight">CitaSmartGG</span>
          </NavLink>

            {/* Menú principal */}
          <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto">
            {allNav.map(({ to, label, exact }) => (
              <NavLink
                key={to} to={to} end={exact}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }>
                {label}
              </NavLink>
            ))}
          </nav>
          {/* Información del usuario */}
          <div className="flex items-center gap-2 ml-4 shrink-0">

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                 {/* Avatar */}
                <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs select-none">
                  {user?.nombre?.[0]?.toUpperCase()}
                </div>
                 {/* Datos del usuario */}
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-slate-700 leading-tight">{user?.nombre}</p>
                  <p className="text-xs text-slate-400 capitalize leading-tight">{user?.rol}</p>
                </div>
                {/* Flecha del menú */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {/* Menú desplegable */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
                  {/* Información del usuario */}
                  <div className="px-3 py-2.5 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">{user?.nombre} {user?.apellido}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                  </div>
                  {/* Botón cerrar sesión */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

 {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-screen-2xl mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
}