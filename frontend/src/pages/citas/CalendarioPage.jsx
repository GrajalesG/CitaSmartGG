// Página principal del calendario de citas del sistema.
// Permite visualizar citas médicas en formato semanal o diario,
// gestionar estados de citas y navegar entre fechas.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { citasApi, profesionalesApi } from '../../api/services';
import { BadgeEstado, Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

//   Horas visibles en el calendario (7am - 8pm)
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); 
const CELL_H = 60; 

// Formatea una fecha a HH:mm
const fmt = (d) => format(new Date(d), 'HH:mm');
const fmtDate = (d) => format(d, 'yyyy-MM-dd');

// Configuración visual de colores según estado de cita
const ESTADO_COLORS = {
  agendada:   { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  confirmada: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  cancelada:  { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  completada: { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' },
  no_asistio: { bg: '#fff7ed', border: '#fb923c', text: '#9a3412' },
};

export default function CalendarioPage() {
  // Estados principales del componente
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = ['admin', 'personal'].includes(user?.rol);
  const [view, setView]               = useState('semana'); // semana | dia
  const [weekStart, setWeekStart]     = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [citas, setCitas]             = useState([]);
  const [profesionales, setProfs]     = useState([]);
  const [filterProfId, setFilterProf] = useState('');
  const [loading, setLoading]         = useState(false);
  const [selected, setSelected]       = useState(null);
  const gridRef = useRef(null);

  const days = view === 'semana'
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : [weekStart];

    // Carga inicial de profesionales disponibles
  useEffect(() => {
    profesionalesApi.getAll()
      .then(r => setProfs(r.data.data))
      .catch(() => {}); 
  }, []);

  useEffect(() => { loadCitas(); }, [weekStart, view, filterProfId]); 
// Función encargada de consultar citas al backend
  const loadCitas = async () => {
    setLoading(true);
    try {
      const params = {
        fecha_inicio: fmtDate(days[0]),
        fecha_fin:    fmtDate(days[days.length - 1]),
        ...(filterProfId ? { profesional_id: filterProfId } : {}),
      };
      const r = await citasApi.getAll(params);
      setCitas(r.data.data);
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  // Funciones de navegación temporal
  const goToday  = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const goPrev   = () => setWeekStart(v => view === 'semana' ? subWeeks(v, 1) : addDays(v, -1));
  const goNext   = () => setWeekStart(v => view === 'semana' ? addWeeks(v, 1) : addDays(v, 1));

  // Cambio dinámico entre vista semanal y diaria
  const switchView = (v) => {
    setView(v);
    if (v === 'dia') setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };
// Genera el texto descriptivo del rango de fechas
  const weekLabel = view === 'semana'
    ? `${format(days[0], "d 'de' MMM", { locale: es })} – ${format(days[6], "d 'de' MMM 'de' yyyy", { locale: es })}`
    : format(days[0], "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  // Calcula la posición y altura visual de una cita
  const getCitaStyle = (cita, dayIndex, totalCols) => {
    const ini  = new Date(cita.fecha_hora_inicio);
    const fin  = new Date(cita.fecha_hora_fin);
    const startH = ini.getHours() + ini.getMinutes() / 60;
    const endH   = fin.getHours() + fin.getMinutes() / 60;
    const top    = (startH - HOURS[0]) * CELL_H;
    const height = Math.max((endH - startH) * CELL_H - 3, 22);
    return { top, height };
  };

  // Filtra las citas correspondientes a un día específico
  const citasByDay = (day) =>
    citas.filter(c => isSameDay(new Date(c.fecha_hora_inicio), day));

  // Confirma una cita y actualiza el calendario
  const confirmarCita = async (id) => {
    try {
      await citasApi.confirmar(id);
      toast.success('Cita confirmada');
      setSelected(prev => prev ? { ...prev, estado: 'confirmada' } : null);
      loadCitas();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
  };
// Cancela una cita y recarga la información del calendario
  const cancelarCita = async (id, motivo) => {
    try {
      await citasApi.cancelar(id, motivo);
      toast.success('Cita cancelada');
      setSelected(null);
      loadCitas();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
  };

  return (
    // Contenedor principal de la vista calendario
    <div className="flex flex-col -m-6" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Barra superior del calendario:
        contiene controles de navegación,
        filtros y acciones rápidas */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 shrink-0">
        
        <div className="flex border border-slate-200 rounded-lg overflow-hidden">
          {['semana','dia'].map(v => (
            <button key={v} onClick={() => switchView(v)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
                view === v ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}>
              {v === 'semana' ? 'Semana' : 'Día'}
            </button>
          ))}
        </div>

        {/* Controles de navegación temporal */}
        <div className="flex items-center gap-1">
          <button onClick={goPrev}
            className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
            ‹
          </button>
          <button onClick={goNext}
            className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
            ›
          </button>
        </div>

        <span className="text-sm font-medium text-slate-600 capitalize">{weekLabel}</span>

        <div className="ml-auto flex items-center gap-2">
          
          {isStaff && (
            <select className="input text-sm w-48 py-1.5"
              value={filterProfId} onChange={e => setFilterProf(e.target.value)}>
              <option value="">Todos los profesionales</option>
              {profesionales.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
          )}

          <button onClick={goToday} className="btn-secondary text-sm py-1.5 px-3">Hoy</button>
          <button onClick={loadCitas}
            className={`btn-secondary text-sm py-1.5 px-3 ${loading ? 'opacity-50' : ''}`}>
            ↻
          </button>
          <button onClick={() => navigate('/citas/nueva')} className="btn-primary text-sm py-1.5 px-3">
            + Nuevo
          </button>
        </div>
      </div>

      {/* Contenedor principal del grid del calendario */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div style={{ minWidth: view === 'semana' ? 800 : 400 }}>

          
          <div className="sticky top-0 z-20 bg-white border-b border-slate-200"
            style={{ display: 'grid', gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
            <div className="p-2" />
            {days.map((d, i) => (
              <div key={i}
                className={`py-2 px-1 text-center border-l border-slate-100 ${isToday(d) ? 'bg-brand-50' : ''}`}>
                <div className="text-xs font-medium text-slate-400 uppercase">
                  {format(d, 'EEE', { locale: es })}
                </div>
                <div className={`text-xl font-light mt-0.5 leading-none ${isToday(d) ? 'text-brand-600 font-semibold' : 'text-slate-500'}`}>
                  {format(d, 'd')}
                </div>
              </div>
            ))}
          </div>

         
          <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, position: 'relative' }}>
           
            <div>
              {HOURS.map(h => (
                <div key={h} style={{ height: CELL_H }}
                  className="border-b border-slate-100 flex items-start justify-end pr-2 pt-0">
                  <span className="text-xs text-slate-400 font-mono -mt-2.5">
                    {String(h).padStart(2,'0')}:00
                  </span>
                </div>
              ))}
            </div>

            
            {days.map((day, di) => {
              const dayCitas = citasByDay(day);
              return (
                <div key={di} className="border-l border-slate-100 relative"
                  style={{ height: HOURS.length * CELL_H }}>
                  
                  {HOURS.map(h => (
                    <div key={h}
                      style={{ height: CELL_H, top: (h - HOURS[0]) * CELL_H }}
                      className="absolute left-0 right-0 border-b border-slate-100 hover:bg-brand-50/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/citas/nueva`)}
                    />
                  ))}

                
                  {dayCitas.map(cita => {
                    const ini  = new Date(cita.fecha_hora_inicio);
                    const fin  = new Date(cita.fecha_hora_fin);
                    const startH = ini.getHours() + ini.getMinutes() / 60;
                    const endH   = fin.getHours() + fin.getMinutes() / 60;
                    if (endH <= HOURS[0] || startH >= HOURS[HOURS.length-1]+1) return null;
                    const { top, height } = getCitaStyle(cita, di, days.length);
                    const colors = ESTADO_COLORS[cita.estado] || ESTADO_COLORS.agendada;
                    return (
                      <div
                        key={cita.id}
                        onClick={(e) => { e.stopPropagation(); setSelected(cita); }}
                        style={{
                          position: 'absolute', top: top + 1, left: 2, right: 2, height,
                          background: colors.bg, borderLeft: `3px solid ${colors.border}`,
                          color: colors.text,
                        }}
                        className="rounded-md px-2 py-1 cursor-pointer overflow-hidden z-10 hover:opacity-90 hover:shadow-sm transition-all"
                      >
                        <div className="text-xs font-semibold leading-tight truncate">
                          {cita.paciente_nombre}
                        </div>
                        {height > 30 && (
                          <div className="text-xs opacity-75 truncate">
                            {fmt(ini)} · {cita.servicio_nombre}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de detalle de cita */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de cita" size="sm">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <BadgeEstado estado={selected.estado} />
              <span className="text-xs text-slate-400 font-mono">#{selected.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Paciente</p>
                <p className="font-medium text-slate-800">{selected.paciente_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Profesional</p>
                <p className="font-medium text-slate-800">{selected.profesional_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Servicio</p>
                <p className="text-slate-700">{selected.servicio_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Hora</p>
                <p className="text-slate-700 font-mono">{fmt(selected.fecha_hora_inicio)} – {fmt(selected.fecha_hora_fin)}</p>
              </div>
            </div>

            {selected.motivo_consulta && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                <p className="text-xs font-semibold text-slate-400 mb-1">Motivo</p>
                {selected.motivo_consulta}
              </div>
            )}

            {['agendada','confirmada'].includes(selected.estado) && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                {selected.estado === 'agendada' && (
                  <button onClick={() => confirmarCita(selected.id)}
                    className="btn-primary text-sm py-2">
                    ✓ Confirmar cita
                  </button>
                )}
                <button
                  onClick={async () => {
                    const m = window.prompt('Motivo de cancelación:');
                    if (m) await cancelarCita(selected.id, m);
                  }}
                  className="btn-danger text-sm py-2">
                  ✕ Cancelar cita
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}