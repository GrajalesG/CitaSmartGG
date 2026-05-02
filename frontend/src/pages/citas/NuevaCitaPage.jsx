// Página para crear una nueva cita médica
// Maneja la selección de paciente, profesional, servicio, fecha y horario disponible y envía la información al backend para agendar la cita
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { citasApi, pacientesApi, profesionalesApi, serviciosApi, horariosApi } from '../../api/services';
import { PageHeader, FormField } from '../../components/ui';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Fecha actual en formato estándar para validaciones
const today = format(new Date(), 'yyyy-MM-dd');

export default function NuevaCitaPage() {
  const navigate = useNavigate();
  // Estados para catálogos del sistema
  const [pacientes, setPacientes]       = useState([]);
  const [profesionales, setProfs]       = useState([]);
  const [servicios, setServicios]       = useState([]);
  const [slots, setSlots]               = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [errors, setErrors]             = useState({});

  const [form, setForm] = useState({
    paciente_id: '', profesional_id: '', servicio_id: '',
    fecha: today, hora: '', motivo_consulta: '',
  });

  const [loadError, setLoadError] = useState(false);

  // Carga inicial de datos necesarios para el formulario
  const loadCatalogos = async () => {
    setLoadError(false);
    try {
      const [p, pr, s] = await Promise.all([
        pacientesApi.getAll(),
        profesionalesApi.getAll(),
        serviciosApi.getAll(),
      ]);
      setPacientes(p.data.data);
      setProfs(pr.data.data);
      setServicios(s.data.data);
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      toast.error('Error cargando datos: ' + msg);
      setLoadError(true);
    }
  };

  useEffect(() => { loadCatalogos(); }, []); 

  useEffect(() => {
    loadSlots();
  }, [form.profesional_id, form.servicio_id, form.fecha]); 

  // Consulta de disponibilidad de horarios
  const loadSlots = async () => {
    if (!form.profesional_id || !form.servicio_id || !form.fecha) { setSlots([]); return; }
    const svc = servicios.find(s => String(s.id) === String(form.servicio_id));
    if (!svc) return;
    setSlotsLoading(true);
    try {
      const r = await horariosApi.getDisponibilidad(form.profesional_id, form.fecha, svc.duracion_minutos);
      setSlots(r.data.data);
      setForm(f => ({ ...f, hora: '' }));
    } catch (e) {
      setSlots([]);
      toast.error(e.response?.data?.message || 'Error cargando horarios');
    } finally { setSlotsLoading(false); }
  };
 // Manejo genérico de cambios en inputs del formulario
  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: '' }));
  };
// Validación básica del formulario antes de enviar
  const validate = () => {
    const e = {};
    if (!form.paciente_id)   e.paciente_id   = 'Seleccione un paciente';
    if (!form.profesional_id)e.profesional_id = 'Seleccione un profesional';
    if (!form.servicio_id)   e.servicio_id   = 'Seleccione un servicio';
    if (!form.fecha)         e.fecha         = 'Seleccione una fecha';
    if (!form.hora)          e.hora          = 'Seleccione un horario';
    setErrors(e);
    return !Object.keys(e).length;
  };

// Envío final de la cita al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await citasApi.create({
        paciente_id:      Number(form.paciente_id),
        profesional_id:   Number(form.profesional_id),
        servicio_id:      Number(form.servicio_id),
        fecha_hora_inicio:`${form.fecha}T${form.hora}:00`,
        motivo_consulta:   form.motivo_consulta || undefined,
      });
      toast.success('Cita agendada correctamente');
      navigate('/citas');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally { setSubmitting(false); }
  };
// Servicio seleccionado para mostrar info adicional (duración, precio)
  const selectedSvc = servicios.find(s => String(s.id) === String(form.servicio_id));

  return (
    <div className="max-w-2xl">
       {/* Encabezado de la página */}
      <PageHeader title="Nueva cita" subtitle="Complete los datos para agendar una cita médica" />

      {loadError && (
        <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <span>⚠ No se pudieron cargar los datos. Asegúrate de que el servidor esté corriendo.</span>
          <button onClick={loadCatalogos} className="ml-4 font-semibold underline hover:no-underline shrink-0">
            Reintentar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Paciente */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Paciente</h3>
          <FormField label="Paciente" required error={errors.paciente_id}>
            <select className="input" value={form.paciente_id} onChange={set('paciente_id')}>
              <option value="">Seleccionar paciente…</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.documento}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Servicio y profesional */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Servicio médico</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Servicio" required error={errors.servicio_id}>
              <select className="input" value={form.servicio_id} onChange={set('servicio_id')}>
                <option value="">Seleccionar…</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre} ({s.duracion_minutos} min)</option>
                ))}
              </select>
            </FormField>
            <FormField label="Profesional" required error={errors.profesional_id}>
              <select className="input" value={form.profesional_id} onChange={set('profesional_id')}>
                <option value="">Seleccionar…</option>
                {profesionales.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                ))}
              </select>
            </FormField>
          </div>
          {selectedSvc && (
            <div className="flex gap-4 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
              <span>⏱ Duración: <strong>{selectedSvc.duracion_minutos} min</strong></span>
              {selectedSvc.precio > 0 && (
                <span>💰 Precio: <strong>${Number(selectedSvc.precio).toLocaleString()}</strong></span>
              )}
            </div>
          )}
        </div>

        {/* Fecha y hora */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Fecha y horario</h3>
          <FormField label="Fecha" required error={errors.fecha}>
            <input type="date" className="input w-48" value={form.fecha}
              min={today} onChange={set('fecha')} />
          </FormField>

          <div>
            <label className="label">
              Horario disponible <span className="text-red-500">*</span>
            </label>
            {slotsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <div className="animate-spin w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full" />
                Cargando disponibilidad…
              </div>
            ) : !form.profesional_id || !form.servicio_id ? (
              <p className="text-sm text-slate-400 py-2">Seleccione profesional y servicio para ver horarios</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-amber-600 py-2">⚠ Sin disponibilidad para esta fecha</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {slots.map(s => (
                  <button
                    key={s.hora_inicio}
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, hora: s.hora_inicio })); setErrors(er => ({ ...er, hora: '' })); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium border transition-colors ${
                      form.hora === s.hora_inicio
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50'
                    }`}
                  >
                    {s.hora_inicio}
                  </button>
                ))}
              </div>
            )}
            {errors.hora && <p className="text-red-500 text-xs mt-1">{errors.hora}</p>}
          </div>
        </div>

        {/* Motivo */}
        <div className="card p-5">
          <FormField label="Motivo de consulta">
            <textarea className="input min-h-[90px]" placeholder="Describa brevemente el motivo de la consulta…"
              value={form.motivo_consulta} onChange={set('motivo_consulta')} />
          </FormField>
        </div>
 {/* Acciones del formulario */}
        <div className="flex gap-3 justify-end pb-6">
          <button type="button" className="btn-secondary" onClick={() => navigate('/citas')}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Agendando…' : '✓ Agendar cita'}
          </button>
        </div>
      </form>
    </div>
  );
}