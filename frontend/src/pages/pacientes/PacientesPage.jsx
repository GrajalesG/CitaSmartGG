import { useState } from 'react';
import { pacientesApi } from '../../api/services';
import { PageHeader, Table, SearchInput, Modal, BadgeEstado, FormField, ConfirmDialog } from '../../components/ui';
import { useFetch, useForm } from '../../hooks/useFetch';
import toast from 'react-hot-toast';

// Tipos de documento permitidos para pacientes
const TIPOS_DOC = ['CC','TI','CE','PASAPORTE'];
// Estado inicial del formulario de paciente
const EMPTY = { nombre:'', apellido:'', tipo_documento:'CC', documento:'', fecha_nacimiento:'', telefono:'', email:'', direccion:'' };

export default function PacientesPage() {
  //Carga de datos principal
  const { data: pacientes, loading, reload } = useFetch(() => pacientesApi.getAll());
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Hook de formulario personalizado
  const { values, errors, set, setAll, reset, setErrors } = useForm(EMPTY);
//Abre modal para crear nuevo paciente
  const openNew = () => { reset(); setEditing(null); setModal(true); };
  //Abre modal para editar paciente existente
  const openEdit = (p) => {
    setEditing(p);
    setAll({ ...EMPTY, ...p, fecha_nacimiento: p.fecha_nacimiento?.slice(0,10) || '' });
    setModal(true);
  };
//Validación simple del formulario antes de enviar
  const validate = () => {
    const e = {};
    if (!values.nombre.trim())    e.nombre    = 'Requerido';
    if (!values.apellido.trim())  e.apellido  = 'Requerido';
    if (!values.documento.trim()) e.documento = 'Requerido';
    if (values.email && !/\S+@\S+\.\S+/.test(values.email)) e.email = 'Email inválido';
    setErrors(e);
    return !Object.keys(e).length;
  };
//Crear o actualizar paciente según el modo (editing o nuevo)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await pacientesApi.update(editing.id, values);
        toast.success('Paciente actualizado');
      } else {
        await pacientesApi.create(values);
        toast.success('Paciente creado');
      }
      setModal(false); reload();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally { setSubmitting(false); }
  };

  //Elimina un paciente luego de confirmación
  const handleDelete = async () => {
    try {
      await pacientesApi.remove(delConfirm.id);
      toast.success('Paciente eliminado');
      setDelConfirm(null); reload();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
  };
//Filtro de búsqueda en frontend (nombre, documento, email)
  const filtered = pacientes.filter(p =>
    !search ||
    `${p.nombre} ${p.apellido} ${p.documento} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );
//Configuración de columnas de la tabla
  const cols = [
    { key: 'nombre',    label: 'Nombre',    render: r => <span className="font-medium">{r.nombre} {r.apellido}</span> },
    { key: 'documento', label: 'Documento', render: r => <span className="font-mono text-sm">{r.tipo_documento}: {r.documento}</span> },
    { key: 'telefono',  label: 'Teléfono' },
    { key: 'email',     label: 'Email',     render: r => r.email || <span className="text-slate-300">—</span> },
    { key: 'fecha_nacimiento', label: 'Fecha nac.', render: r =>
      r.fecha_nacimiento ? new Date(r.fecha_nacimiento).toLocaleDateString('es-CO') : '—'
    },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1.5">
        <button onClick={() => openEdit(r)}
          className="text-xs px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
          Editar
        </button>
        <button onClick={() => setDelConfirm(r)}
          className="text-xs px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
          Eliminar
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pacientes"
        subtitle={`${pacientes.length} pacientes registrados`}
        action={
          <button className="btn-primary" onClick={openNew}>+ Nuevo paciente</button>
        }
      />

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, documento…" />
          <span className="text-sm text-slate-400">{filtered.length} resultados</span>
        </div>
        <Table columns={cols} data={filtered} loading={loading} emptyMsg="Sin pacientes registrados" />
      </div>

      {/* Modal de creación / edición de paciente */} 
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar paciente' : 'Nuevo paciente'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre" required error={errors.nombre}>
              <input className="input" value={values.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan" />
            </FormField>
            <FormField label="Apellido" required error={errors.apellido}>
              <input className="input" value={values.apellido} onChange={e => set('apellido', e.target.value)} placeholder="Pérez" />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Tipo doc.">
              <select className="input" value={values.tipo_documento} onChange={e => set('tipo_documento', e.target.value)}>
                {TIPOS_DOC.map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Documento" required error={errors.documento} className="col-span-2">
              <input className="input" value={values.documento} onChange={e => set('documento', e.target.value)} placeholder="1234567890" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Teléfono">
              <input className="input" value={values.telefono} onChange={e => set('telefono', e.target.value)} placeholder="3001234567" />
            </FormField>
            <FormField label="Email" error={errors.email}>
              <input type="email" className="input" value={values.email} onChange={e => set('email', e.target.value)} placeholder="juan@email.com" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha de nacimiento">
              <input type="date" className="input" value={values.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} />
            </FormField>
            <FormField label="Dirección">
              <input className="input" value={values.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle 123 #45-67" />
            </FormField>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Guardando…' : editing ? 'Actualizar' : 'Crear paciente'}
            </button>
          </div>
        </form>
      </Modal>

{/* Confirmación de eliminación */}
      <ConfirmDialog
        open={!!delConfirm} danger
        title="Eliminar paciente"
        message={`¿Eliminar a ${delConfirm?.nombre} ${delConfirm?.apellido}? Esta acción no se puede deshacer.`}
        onClose={() => setDelConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}