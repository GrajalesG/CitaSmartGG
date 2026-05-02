// Dashboard principal del sistema de citas médicas
// Muestra un resumen general de actividad: citas del día, próximas citas  y estadísticas globales del sistema según el rol del usuario
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { citasApi, pacientesApi, profesionalesApi } from '../../api/services';
import { BadgeEstado, StatCard } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Utilidades de formato de fechas
const today = new Date();
const fmt    = (d) => format(new Date(d), 'HH:mm');
const fmtDate = (d) => format(d, 'yyyy-MM-dd');

// Helper para evitar romper la app si una petición falla (ej: permisos)
const safeCall = async (fn) => { try { return await fn(); } catch { return null; } };

export default function DashboardPage() {
  // Usuario autenticado y control de roles
  const { user } = useAuth();
  const isStaff = ['admin', 'personal'].includes(user?.rol);

  const [stats, setStats]           = useState({ total: 0, agendadas: 0, confirmadas: 0, canceladas: 0 });
  const [citasHoy, setCitasHoy]     = useState([]);
  const [proximasCitas, setProximas]= useState([]);
  const [counts, setCounts]         = useState({ pacientes: null, profesionales: null });
  const [loading, setLoading]       = useState(true);

  // Carga inicial del dashboard
  useEffect(() => {
    const load = async () => {
      try {
        const todayStr = fmtDate(today);
        const nextWeek = fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7));

        // Citas: accesibles para todos los roles
        const [resHoy, resProx] = await Promise.all([
          citasApi.getAll({ fecha_inicio: todayStr, fecha_fin: todayStr }),
          citasApi.getAll({ fecha_inicio: todayStr, fecha_fin: nextWeek }),
        ]);

        const hoy = resHoy.data.data;
        setCitasHoy(hoy);
        setProximas(resProx.data.data.filter(c => !isToday(new Date(c.fecha_hora_inicio))).slice(0, 5));
        setStats({
          total:       hoy.length,
          agendadas:   hoy.filter(c => c.estado === 'agendada').length,
          confirmadas: hoy.filter(c => c.estado === 'confirmada').length,
          canceladas:  hoy.filter(c => c.estado === 'cancelada').length,
        });

        // Conteos: solo si el rol tiene permiso (admin / personal)
        if (isStaff) {
          const [resPac, resProf] = await Promise.all([
            safeCall(() => pacientesApi.getAll()),
            safeCall(() => profesionalesApi.getAll()),
          ]);
          setCounts({
            pacientes:     resPac?.data?.data?.length ?? null,
            profesionales: resProf?.data?.data?.length ?? null,
          });
        }
      } catch (e) {
        toast.error('Error cargando dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isStaff]);

   // Acción rápida: confirmar una cita desde el dashboard
  const confirmar = async (id) => {
    try {
      await citasApi.confirmar(id);
      toast.success('Cita confirmada');
      setCitasHoy(prev => prev.map(c => c.id === id ? { ...c, estado: 'confirmada' } : c));
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
         {/* Encabezado del dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Buen día, {user?.nombre} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1 capitalize">
            {format(today, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <Link to="/citas/nueva" className="btn-primary flex items-center gap-2">
          + Nueva cita
        </Link>
      </div>

 {/* Tarjetas de resumen del día */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Citas hoy"      value={stats.total}       icon="📋" color="brand"  />
        <StatCard label="Confirmadas"    value={stats.confirmadas} icon="✅" color="green"  />
        <StatCard label="Agendadas"      value={stats.agendadas}   icon="🕐" color="orange" />
        <StatCard label="Canceladas hoy" value={stats.canceladas}  icon="❌" color="red"    />
      </div>

      {/* Panel administrativo (solo roles con permisos) */}
      {isStaff && counts.pacientes !== null && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-2xl">👤</div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{counts.pacientes}</p>
            <p className="text-sm text-slate-500">Pacientes registrados</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl">🩺</div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{counts.profesionales}</p>
            <p className="text-sm text-slate-500">Profesionales activos</p>
          </div>
        </div>
      </div>
      )}
 {/* Sección principal: citas del día y próximas citas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Citas de hoy */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Citas de hoy</h2>
            <Link to="/citas" className="text-xs text-brand-600 hover:text-brand-700 font-medium">Ver todas →</Link>
          </div>
          {citasHoy.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">
              <div className="text-4xl mb-2">📅</div>
              Sin citas programadas para hoy
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {citasHoy.map(c => (
                <div key={c.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="text-center w-14 shrink-0">
                    <p className="text-sm font-bold text-slate-800 font-mono">{fmt(c.fecha_hora_inicio)}</p>
                    <p className="text-xs text-slate-400 font-mono">{fmt(c.fecha_hora_fin)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.paciente_nombre}</p>
                    <p className="text-xs text-slate-400 truncate">{c.servicio_nombre} · {c.profesional_nombre}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <BadgeEstado estado={c.estado} />
                    {c.estado === 'agendada' && (
                      <button
                        onClick={() => confirmar(c.id)}
                        className="text-xs text-green-600 hover:text-green-700 font-medium border border-green-200 px-2 py-0.5 rounded hover:bg-green-50 transition-colors"
                      >
                        Confirmar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximas citas */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Próximos 7 días</h2>
          </div>
          {proximasCitas.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">Sin citas próximas</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {proximasCitas.map(c => (
                <div key={c.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-semibold text-brand-600 capitalize">
                      {format(new Date(c.fecha_hora_inicio), "EEEE d MMM", { locale: es })}
                    </p>
                    <BadgeEstado estado={c.estado} />
                  </div>
                  <p className="text-sm font-medium text-slate-800">{c.paciente_nombre}</p>
                  <p className="text-xs text-slate-400">{fmt(c.fecha_hora_inicio)} · {c.servicio_nombre}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}