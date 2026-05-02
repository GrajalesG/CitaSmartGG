import { useState } from 'react';
import { horariosApi, bloqueosApi, profesionalesApi } from '../../api/services';
import { PageHeader, Modal, FormField } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import toast from 'react-hot-toast';

// Días de la semana en texto y su equivalente numérico usado por el backend
const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DIAS_NUM = [1, 2, 3, 4, 5, 6, 0]; // lun=1...dom=0

export default function HorariosPage() {
  // Carga inicial de profesionales desde el backend
  const { data: profesionales } = useFetch(() => profesionalesApi.getAll());
  const [selectedProf, setSelectedProf] = useState('');
  const [horarios, setHorarios]         = useState([]);
  const [bloqueos, setBloqueos]         = useState([]);
  const [loadingH, setLoadingH]         = useState(false);

  // Modals
  const [horarioModal, setHorarioModal] = useState(false);
  const [bloqueoModal, setBloqueoModal] = useState(false);
  const [hForm, setHForm] = useState({ dia_semana: 1, hora_inicio: '08:00', hora_fin: '12:00' });
  const [bForm, setBForm] = useState({ fecha_inicio: '', fecha_fin: '', motivo: '' });
  const [submitting, setSubmitting] = useState(false);

  // Carga los horarios y bloqueos del profesional seleccionado.
  const loadHorarios = async (profId) => {
    if (!profId) { setHorarios([]); setBloqueos([]); return; }
    setLoadingH(true);
    try {
      const [h, b] = await Promise.all([
        horariosApi.getByProfesional(profId),
        bloqueosApi.getByProfesional(profId),
      ]);
      setHorarios(h.data.data);
      setBloqueos(b.data.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoadingH(false); }
  };
// Cambia el profesional activo y recarga su información
  const handleProfChange = (v) => { setSelectedProf(v); loadHorarios(v); };

  //Crea un nuevo horario para el profesional seleccionado.
  const handleAddHorario = async (e) => {
    e.preventDefault();
    if (hForm.hora_inicio >= hForm.hora_fin) { toast.error('La hora de fin debe ser mayor a la de inicio'); return; }
    setSubmitting(true);
    try {
      await horariosApi.create({ ...hForm, profesional_id: Number(selectedProf), dia_semana: Number(hForm.dia_semana) });
      toast.success('Horario asignado');
      setHorarioModal(false);
      loadHorarios(selectedProf);
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setSubmitting(false); }
  };
 // Elimina un horario existente con confirmación del usuario
  const handleDeleteHorario = async (id) => {
    if (!window.confirm('¿Eliminar este horario?')) return;
    try { await horariosApi.remove(id); toast.success('Horario eliminado'); loadHorarios(selectedProf); }
    catch (e) { toast.error(e.message); }
  };

  //Crea un bloqueo de disponibilidad (ej: vacaciones o reuniones).
  const handleAddBloqueo = async (e) => {
    e.preventDefault();
    if (!bForm.fecha_inicio || !bForm.fecha_fin) { toast.error('Complete las fechas'); return; }
    setSubmitting(true);
    try {
      await bloqueosApi.create({ ...bForm, profesional_id: Number(selectedProf) });
      toast.success('Bloqueo registrado');
      setBloqueoModal(false);
      loadHorarios(selectedProf);
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setSubmitting(false); }
  };

   // Elimina un bloqueo existente
  const handleDeleteBloqueo = async (id) => {
    try { await bloqueosApi.remove(id); toast.success('Bloqueo eliminado'); loadHorarios(selectedProf); }
    catch (e) { toast.error(e.message); }
  };

  //Construye la estructura visual semanal agrupando horarios por día.
  const grid = DIAS_NUM.map((dia, i) => ({
    nombre: DIAS[i],
    dia,
    horarios: horarios.filter(h => h.dia_semana === dia),
  }));

  return (
    <div className="space-y-5">
      <PageHeader title="Horarios" subtitle="Gestión de disponibilidad y bloqueos de profesionales" />

      {/* Selector de profesional */}
      <div className="card p-4 flex items-center gap-4">
        <div className="flex-1 max-w-xs">
          <label className="label text-xs">Seleccionar profesional</label>
          <select className="input" value={selectedProf} onChange={e => handleProfChange(e.target.value)}>
            <option value="">— Elige un profesional —</option>
            {profesionales.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} {p.apellido} {p.especialidad_nombre ? `· ${p.especialidad_nombre}` : ''}</option>
            ))}
          </select>
        </div>
        {selectedProf && (
          <>
            <button className="btn-primary text-sm mt-4" onClick={() => setHorarioModal(true)}>
              + Agregar horario
            </button>
            <button className="btn-secondary text-sm mt-4" onClick={() => setBloqueoModal(true)}>
               Agregar bloqueo
            </button>
          </>
        )}
      </div>

      {!selectedProf ? (
        <div className="card p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">🕐</div>
          <p className="font-medium">Selecciona un profesional</p>
          <p className="text-sm mt-1">para gestionar su disponibilidad semanal</p>
        </div>
      ) : loadingH ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Grilla semanal */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700">Horario semanal</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {grid.map(({ nombre, dia, horarios: hs }) => (
                <div key={dia} className="px-5 py-3 flex items-start gap-4 hover:bg-slate-50/40">
                  <div className="w-24 shrink-0">
                    <span className={`text-sm font-semibold ${hs.length ? 'text-slate-800' : 'text-slate-400'}`}>
                      {nombre}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {hs.length === 0 ? (
                      <span className="text-xs text-slate-300 italic">Sin horario</span>
                    ) : hs.map(h => (
                      <div key={h.id}
                        className="flex items-center gap-1.5 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-medium">
                        <span className="font-mono">{h.hora_inicio.slice(0,5)} – {h.hora_fin.slice(0,5)}</span>
                        <button
                          onClick={() => handleDeleteHorario(h.id)}
                          className="text-brand-400 hover:text-red-500 transition-colors leading-none ml-1">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloqueos */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700">Bloqueos activos</h3>
            </div>
            {bloqueos.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">Sin bloqueos registrados</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {bloqueos.map(b => (
                  <div key={b.id} className="px-5 py-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-mono text-slate-600">
                        {new Date(b.fecha_inicio).toLocaleString('es-CO', { dateStyle:'short', timeStyle:'short' })}
                      </p>
                      <p className="text-xs font-mono text-slate-600">
                        → {new Date(b.fecha_fin).toLocaleString('es-CO', { dateStyle:'short', timeStyle:'short' })}
                      </p>
                      {b.motivo && <p className="text-xs text-slate-400 mt-0.5">{b.motivo}</p>}
                    </div>
                    <button onClick={() => handleDeleteBloqueo(b.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors shrink-0 text-lg leading-none">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal nuevo horario */}
      <Modal open={horarioModal} onClose={() => setHorarioModal(false)} title="Agregar horario" size="sm">
        <form onSubmit={handleAddHorario} className="space-y-4">
          <FormField label="Día de la semana">
            <select className="input" value={hForm.dia_semana} onChange={e => setHForm(f => ({ ...f, dia_semana: e.target.value }))}>
              {DIAS_NUM.map((d, i) => <option key={d} value={d}>{DIAS[i]}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Hora inicio">
              <input type="time" className="input" value={hForm.hora_inicio}
                onChange={e => setHForm(f => ({ ...f, hora_inicio: e.target.value }))} />
            </FormField>
            <FormField label="Hora fin">
              <input type="time" className="input" value={hForm.hora_fin}
                onChange={e => setHForm(f => ({ ...f, hora_fin: e.target.value }))} />
            </FormField>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn-secondary" onClick={() => setHorarioModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal bloqueo */}
      <Modal open={bloqueoModal} onClose={() => setBloqueoModal(false)} title="Agregar bloqueo" size="sm">
        <form onSubmit={handleAddBloqueo} className="space-y-4">
          <FormField label="Desde">
            <input type="datetime-local" className="input" value={bForm.fecha_inicio}
              onChange={e => setBForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
          </FormField>
          <FormField label="Hasta">
            <input type="datetime-local" className="input" value={bForm.fecha_fin}
              onChange={e => setBForm(f => ({ ...f, fecha_fin: e.target.value }))} />
          </FormField>
          <FormField label="Motivo">
            <input className="input" value={bForm.motivo} placeholder="Vacaciones, reunión, etc."
              onChange={e => setBForm(f => ({ ...f, motivo: e.target.value }))} />
          </FormField>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn-secondary" onClick={() => setBloqueoModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Bloquear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}