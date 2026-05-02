import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { citasApi, profesionalesApi, horariosApi } from '../../api/services';
import { PageHeader, Table, BadgeEstado, SearchInput, Modal, FormField } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Funciones auxiliares para formateo de fechas
const fmt     = (d) => format(new Date(d), 'dd/MM/yyyy HH:mm');
const fmtDate = (d) => format(new Date(d), 'yyyy-MM-dd');
const today   = fmtDate(new Date());

// Estados posibles de una cita utilizados en filtros y visualización
const ESTADOS = ['', 'agendada', 'confirmada', 'cancelada', 'completada', 'no_asistio'];

export default function CitasPage() {
  const { user } = useAuth();
  const isStaff = ['admin', 'personal'].includes(user?.rol);

 // Estados principales del componente
  const [citas, setCitas]               = useState([]);
  const [profesionales, setProfs]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filters, setFilters]           = useState({ fecha_inicio: today, fecha_fin: '', profesional_id: '', estado: '' });
  const [search, setSearch]             = useState('');

  //Estados relacionados con modales y acciones
  const [cancelModal, setCancelModal]       = useState(null);
  const [cancelMotivo, setCancelMotivo]     = useState('');
  const [reagendarModal, setReagendarModal] = useState(null);
  const [rFecha, setRFecha]                 = useState('');
  const [rHora, setRHora]                   = useState('');
  const [rSlots, setRSlots]                 = useState([]);
  const [rSlotsLoading, setRSlotsLoading]   = useState(false);
  const [rSubmitting, setRSubmitting]       = useState(false);

  //Carga principal de citas
  //Realiza la consulta al backend aplicando filtros dinámicos y actualiza la tabla principal del sistema.

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v));
      const r = await citasApi.getAll(params);
      setCitas(r.data.data);
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [filters]);

  //Carga inicial de profesionales
  useEffect(() => {
    profesionalesApi.getAll()
      .then(r => setProfs(r.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  //Carga de horarios disponibles para reagendar
  // Consulta automáticamente los slots disponibles del profesional seleccionado según la fecha y duración del servicio.
  useEffect(() => {
    if (!reagendarModal || !rFecha) return;
    const loadSlots = async () => {
      setRSlotsLoading(true);
      setRHora('');
      setRSlots([]);
      try {
        const r = await horariosApi.getDisponibilidad(
          reagendarModal.profesional_id, rFecha, reagendarModal.duracion_minutos
        );
        setRSlots(r.data.data);
      } catch (e) { toast.error(e.response?.data?.message || e.message); }
      finally { setRSlotsLoading(false); }
    };
    loadSlots();
  }, [rFecha, reagendarModal]);

  //Abre modal de reagendamiento
  const openReagendar = (cita) => {
    setReagendarModal(cita);
    setRFecha('');
    setRHora('');
    setRSlots([]);
  };

  //Reagenda una cita
  //Envía la nueva fecha y hora al backend validando previamente que exista una selección válida.
  const handleReagendar = async () => {
    if (!rFecha || !rHora) { toast.error('Seleccione fecha y horario'); return; }
    setRSubmitting(true);
    try {
      await citasApi.reprogramar(reagendarModal.id, { fecha_hora_inicio: `${rFecha}T${rHora}:00` });
      toast.success('Cita reagendada correctamente');
      setReagendarModal(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setRSubmitting(false); }
  };

  //Cancelar cita
  const handleCancelar = async () => {
    if (!cancelMotivo.trim()) { toast.error('Ingrese el motivo'); return; }
    try {
      await citasApi.cancelar(cancelModal.id, cancelMotivo);
      toast.success('Cita cancelada');
      setCancelModal(null); setCancelMotivo('');
      load();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
  };

  // Confirmar cita
  const handleConfirmar = async (id) => {
    try { await citasApi.confirmar(id); toast.success('Cita confirmada'); load(); }
    catch (e) { toast.error(e.response?.data?.message || e.message); }
  };

//Completar cita
  const handleCompletar = async (id) => {
    const obs = window.prompt('Observaciones (opcional):');
    if (obs === null) return;
    try { await citasApi.completar(id, obs); toast.success('Cita completada'); load(); }
    catch (e) { toast.error(e.response?.data?.message || e.message); }
  };

  //Filtrado local por búsqueda textual
  const filtered = citas.filter(c =>
    !search ||
    c.paciente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.profesional_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.servicio_nombre?.toLowerCase().includes(search.toLowerCase())
  );
//Configuración dinámica de columnas de la tabla
  const cols = [
    { key: 'id',                 label: '#',            render: r => <span className="text-slate-400 text-xs font-mono">#{r.id}</span> },
    { key: 'paciente_nombre',    label: 'Paciente',     render: r => <span className="font-medium">{r.paciente_nombre}</span> },
    { key: 'profesional_nombre', label: 'Profesional' },
    { key: 'servicio_nombre',    label: 'Servicio' },
    { key: 'fecha_hora_inicio',  label: 'Fecha / Hora', render: r => (
      <span className="font-mono text-xs">{fmt(r.fecha_hora_inicio)}</span>
    )},
    { key: 'estado', label: 'Estado', render: r => <BadgeEstado estado={r.estado} /> },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1 flex-wrap">
        {r.estado === 'agendada' && (
          <button onClick={() => handleConfirmar(r.id)}
            className="text-xs px-2 py-1 rounded text-green-700 hover:bg-green-50 border border-green-200 transition-colors">
            Confirmar
          </button>
        )}
        {['agendada','confirmada'].includes(r.estado) && (<>
          <button onClick={() => openReagendar(r)}
            className="text-xs px-2 py-1 rounded text-brand-600 hover:bg-brand-50 border border-brand-200 transition-colors">
            Reagendar
          </button>
          <button onClick={() => handleCompletar(r.id)}
            className="text-xs px-2 py-1 rounded text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
            Completar
          </button>
          <button onClick={() => setCancelModal(r)}
            className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 border border-red-200 transition-colors">
            Cancelar
          </button>
        </>)}
      </div>
    )},
  ];

  return (
    
    <div className="space-y-5">
      {/* Encabezado principal del módulo */}
      <PageHeader
        title="Citas"
        subtitle="Gestión de citas médicas"
        action={
          <Link to="/citas/nueva" className="btn-primary flex items-center gap-2">
            + Nueva cita
          </Link>
        }
      />

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label text-xs">Desde</label>
            <input type="date" className="input w-36"
              value={filters.fecha_inicio}
              onChange={e => setFilters(f => ({ ...f, fecha_inicio: e.target.value }))} />
          </div>
          <div>
            <label className="label text-xs">Hasta</label>
            <input type="date" className="input w-36"
              value={filters.fecha_fin}
              onChange={e => setFilters(f => ({ ...f, fecha_fin: e.target.value }))} />
          </div>
          {isStaff && (
            <div>
              <label className="label text-xs">Profesional</label>
              <select className="input w-44"
                value={filters.profesional_id}
                onChange={e => setFilters(f => ({ ...f, profesional_id: e.target.value }))}>
                <option value="">Todos</option>
                {profesionales.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label text-xs">Estado</label>
            <select className="input w-36"
              value={filters.estado}
              onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}>
              {ESTADOS.map(e => <option key={e} value={e}>{e || 'Todos'}</option>)}
            </select>
          </div>
          <div className="ml-auto">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar paciente, médico…" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">{filtered.length} resultados</span>
          <Link to="/citas/calendario" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
            Ver calendario →
          </Link>
        </div>
        <Table columns={cols} data={filtered} loading={loading} emptyMsg="Sin citas para los filtros seleccionados" />
      </div>

      {/* Modal Reagendar */}
      <Modal open={!!reagendarModal} onClose={() => setReagendarModal(null)} title="Reagendar cita" size="md">
        {reagendarModal && (
          <div className="space-y-4">
            {/* Info de la cita actual */}
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="text-slate-400">Paciente:</span> <strong>{reagendarModal.paciente_nombre}</strong></p>
              <p><span className="text-slate-400">Servicio:</span> {reagendarModal.servicio_nombre} ({reagendarModal.duracion_minutos} min)</p>
              <p><span className="text-slate-400">Fecha actual:</span> <span className="font-mono">{fmt(reagendarModal.fecha_hora_inicio)}</span></p>
            </div>

            {/* Nueva fecha */}
            <FormField label="Nueva fecha" required>
              <input
                type="date"
                className="input w-48"
                value={rFecha}
                min={today}
                onChange={e => setRFecha(e.target.value)}
              />
            </FormField>

            {/* Slots disponibles */}
            <div>
              <label className="label">Horario disponible <span className="text-red-500">*</span></label>
              {!rFecha ? (
                <p className="text-sm text-slate-400 py-2">Seleccione una fecha para ver horarios</p>
              ) : rSlotsLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                  <div className="animate-spin w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full"/>
                  Cargando disponibilidad…
                </div>
              ) : rSlots.length === 0 ? (
                <p className="text-sm text-amber-600 py-2">⚠ Sin disponibilidad para esta fecha</p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {rSlots.map(s => (
                    <button
                      key={s.hora_inicio}
                      type="button"
                      onClick={() => setRHora(s.hora_inicio)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium border transition-colors ${
                        rHora === s.hora_inicio
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50'
                      }`}
                    >
                      {s.hora_inicio}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button className="btn-secondary" onClick={() => setReagendarModal(null)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={handleReagendar}
                disabled={!rFecha || !rHora || rSubmitting}
              >
                {rSubmitting ? 'Guardando…' : '↺ Confirmar reagenda'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/*Modal Cancelar */}
      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancelar cita" size="sm">
        <p className="text-sm text-slate-600 mb-3">
          Cita de <strong>{cancelModal?.paciente_nombre}</strong> — {cancelModal && fmt(cancelModal.fecha_hora_inicio)}
        </p>
        <div>
          <label className="label">Motivo de cancelación <span className="text-red-500">*</span></label>
          <textarea className="input min-h-[80px]" placeholder="Ingrese el motivo…"
            value={cancelMotivo} onChange={e => setCancelMotivo(e.target.value)} />
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button className="btn-secondary" onClick={() => setCancelModal(null)}>Volver</button>
          <button className="btn-danger" onClick={handleCancelar}>Confirmar cancelación</button>
        </div>
      </Modal>
    </div>
  );
}