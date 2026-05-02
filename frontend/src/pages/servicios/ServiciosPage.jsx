import { useState } from 'react';
import { serviciosApi, especialidadesApi } from '../../api/services';
import { PageHeader, Table, Modal, FormField, ConfirmDialog } from '../../components/ui';
import { useFetch, useForm } from '../../hooks/useFetch';
import toast from 'react-hot-toast';

// Estado inicial del formulario de servicios médicos
const EMPTY = { nombre:'', descripcion:'', duracion_minutos:30, precio:0, especialidad_id:'' };

export default function ServiciosPage() {
  //Carga de datos desde API
  const { data: servicios, loading, reload }  = useFetch(() => serviciosApi.getAll());
  const { data: especialidades }              = useFetch(() => especialidadesApi.getAll());
  //Estados de interfaz
  const [modal, setModal]                     = useState(false);
  const [editing, setEditing]                 = useState(null);
  const [delConfirm, setDelConfirm]           = useState(null);
  const [submitting, setSubmitting]           = useState(false);
  const { values, errors, set, setAll, reset, setErrors } = useForm(EMPTY);

  //Apertura de modal (crear / editar)
  const openNew  = () => { reset(); setEditing(null); setModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setAll({ ...EMPTY, ...s, especialidad_id: s.especialidad_id || '', precio: s.precio || 0 });
    setModal(true);
  };
//Validación del formulario
  const validate = () => {
    const e = {};
    if (!values.nombre.trim()) e.nombre = 'Requerido';
    if (!values.duracion_minutos || Number(values.duracion_minutos) < 5) e.duracion_minutos = 'Mínimo 5 minutos';
    setErrors(e); return !Object.keys(e).length;
  };

  //Crear / actualizar servicio
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Normalización de datos antes de enviar al backend
    const body = {
      ...values,
      duracion_minutos: Number(values.duracion_minutos),
      precio: Number(values.precio) || 0,
      especialidad_id: values.especialidad_id || null,
    };
    try {
      if (editing) { await serviciosApi.update(editing.id, body); toast.success('Servicio actualizado'); }
      else         { await serviciosApi.create(body);             toast.success('Servicio creado'); }
      setModal(false); reload();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setSubmitting(false); }
  };

  //Eliminación de servicio
  const handleDelete = async () => {
    try {
      await serviciosApi.remove(delConfirm.id);
      toast.success('Servicio eliminado');
      setDelConfirm(null); reload();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
  };
//Configuración de columnas de la tabla
  const cols = [
    { key: 'nombre', label: 'Servicio', render: r => (
      <div>
        <p className="font-medium text-sm">{r.nombre}</p>
        {r.descripcion && <p className="text-xs text-slate-400 truncate max-w-xs">{r.descripcion}</p>}
      </div>
    )},
    { key: 'especialidad_nombre', label: 'Especialidad', render: r =>
      r.especialidad_nombre
        ? <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{r.especialidad_nombre}</span>
        : <span className="text-slate-300">—</span>
    },
    { key: 'duracion_minutos', label: 'Duración', render: r => (
      <span className="font-mono text-sm">{r.duracion_minutos} min</span>
    )},
    { key: 'precio', label: 'Precio', render: r => (
      r.precio > 0
        ? <span className="font-medium text-green-700">${Number(r.precio).toLocaleString('es-CO')}</span>
        : <span className="text-slate-400 text-xs">Gratuito</span>
    )},
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1.5">
        <button onClick={() => openEdit(r)} className="text-xs px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Editar</button>
        <button onClick={() => setDelConfirm(r)} className="text-xs px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">Eliminar</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
       {/* Encabezado de la página */}
      <PageHeader
        title="Servicios"
        subtitle="Tipos de consulta y procedimientos"
        action={<button className="btn-primary" onClick={openNew}>+ Nuevo servicio</button>}
      />
   {/* Tabla principal */}
      <div className="card overflow-hidden">
        <Table columns={cols} data={servicios} loading={loading} emptyMsg="Sin servicios registrados" />
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar servicio' : 'Nuevo servicio'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nombre" required error={errors.nombre}>
            <input className="input" value={values.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Consulta médica general" />
          </FormField>
          <FormField label="Descripción">
            <textarea className="input min-h-[70px]" value={values.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción del servicio…" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duración (minutos)" required error={errors.duracion_minutos}>
              <input type="number" className="input" min="5" step="5"
                value={values.duracion_minutos} onChange={e => set('duracion_minutos', e.target.value)} />
            </FormField>
            <FormField label="Precio (COP)">
              <input type="number" className="input" min="0"
                value={values.precio} onChange={e => set('precio', e.target.value)} placeholder="0" />
            </FormField>
          </div>
          <FormField label="Especialidad">
            <select className="input" value={values.especialidad_id} onChange={e => set('especialidad_id', e.target.value)}>
              <option value="">Sin especialidad</option>
              {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </FormField>
           {/* Acciones */}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Guardando…' : editing ? 'Actualizar' : 'Crear servicio'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!delConfirm} danger
        title="Eliminar servicio"
        message={`¿Eliminar el servicio "${delConfirm?.nombre}"?`}
        onClose={() => setDelConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}