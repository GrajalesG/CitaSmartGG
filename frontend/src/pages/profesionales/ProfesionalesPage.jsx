import { useState } from 'react';
import { profesionalesApi, especialidadesApi, usuariosApi } from '../../api/services';
import { PageHeader, Table, SearchInput, Modal, FormField } from '../../components/ui';
import { useFetch, useForm } from '../../hooks/useFetch';
import toast from 'react-hot-toast';

  // Estado inicial del formulario de profesional
const EMPTY = { nombre:'', apellido:'', documento:'', email:'', telefono:'', especialidad_id:'', registro_medico:'', usuario_id:'' };

export default function ProfesionalesPage() {
  //Carga de datos desde APIs
  const { data: profesionales, loading, reload } = useFetch(() => profesionalesApi.getAll());
  const { data: especialidades }                 = useFetch(() => especialidadesApi.getAll());
  const { data: usuarios }                       = useFetch(() => usuariosApi.getAll());
  //Estados de interfaz
  const [search, setSearch]                      = useState('');
  const [modal, setModal]                        = useState(false);
  const [editing, setEditing]                    = useState(null);
  const [submitting, setSubmitting]              = useState(false);
  const { values, errors, set, setAll, reset, setErrors } = useForm(EMPTY);

  const usuariosProfesional = usuarios.filter(u => u.rol === 'profesional' && u.activo);

  //Apertura de modal (crear / editar)
  const openNew  = () => { reset(); setEditing(null); setModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setAll({ ...EMPTY, ...p, especialidad_id: p.especialidad_id || '', usuario_id: p.usuario_id || '' });
    setModal(true);
  };
//Validación básica del formulario
  const validate = () => {
    const e = {};
    if (!values.nombre.trim())    e.nombre    = 'Requerido';
    if (!values.apellido.trim())  e.apellido  = 'Requerido';
    if (!values.documento.trim()) e.documento = 'Requerido';
    setErrors(e); return !Object.keys(e).length;
  };

  // Crear / actualizar profesional
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const body = {
      ...values,
      especialidad_id: values.especialidad_id || null,
      usuario_id:      values.usuario_id      || null,
    };
    try {
      if (editing) { await profesionalesApi.update(editing.id, body); toast.success('Profesional actualizado'); }
      else         { await profesionalesApi.create(body);             toast.success('Profesional creado'); }
      setModal(false); reload();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setSubmitting(false); }
  };
  
//Filtrado de búsqueda en tabla
  const filtered = profesionales.filter(p =>
    !search || `${p.nombre} ${p.apellido} ${p.documento} ${p.especialidad_nombre}`
      .toLowerCase().includes(search.toLowerCase())
  );

//Definición de columnas de la tabla
  const cols = [
    { key: 'nombre', label: 'Profesional', render: r => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
          {r.nombre[0]}{r.apellido[0]}
        </div>
        <div>
          <p className="font-medium text-sm">Dr/a. {r.nombre} {r.apellido}</p>
          <p className="text-xs text-slate-400">{r.documento}</p>
        </div>
      </div>
    )},
    { key: 'especialidad_nombre', label: 'Especialidad', render: r =>
      r.especialidad_nombre
        ? <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">{r.especialidad_nombre}</span>
        : <span className="text-slate-300">—</span>
    },
    { key: 'registro_medico', label: 'Registro', render: r =>
      r.registro_medico
        ? <span className="font-mono text-xs text-slate-600">{r.registro_medico}</span>
        : <span className="text-slate-300">—</span>
    },
    { key: 'usuario_id', label: 'Usuario vinculado', render: r =>
      r.usuario_email
        ? <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ {r.usuario_email}</span>
        : <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">⚠ Sin vincular</span>
    },
    { key: 'actions', label: '', render: r => (
      <button onClick={() => openEdit(r)}
        className="text-xs px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
        Editar
      </button>
    )},
  ];

  return (
    <div className="space-y-5">
       {/* Encabezado de página */}
      <PageHeader
        title="Profesionales"
        subtitle={`${profesionales.length} profesionales activos`}
        action={<button className="btn-primary" onClick={openNew}>+ Nuevo profesional</button>}
      />
      {/* Tabla con búsqueda */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, especialidad…" />
          <span className="text-sm text-slate-400">{filtered.length} resultados</span>
        </div>
        <Table columns={cols} data={filtered} loading={loading} emptyMsg="Sin profesionales registrados" />
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar profesional' : 'Nuevo profesional'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre" required error={errors.nombre}>
              <input className="input" value={values.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ana" />
            </FormField>
            <FormField label="Apellido" required error={errors.apellido}>
              <input className="input" value={values.apellido} onChange={e => set('apellido', e.target.value)} placeholder="García" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Documento" required error={errors.documento}>
              <input className="input" value={values.documento} onChange={e => set('documento', e.target.value)} placeholder="12345678" />
            </FormField>
            <FormField label="Registro médico">
              <input className="input" value={values.registro_medico} onChange={e => set('registro_medico', e.target.value)} placeholder="RM-12345" />
            </FormField>
          </div>
          <FormField label="Especialidad">
            <select className="input" value={values.especialidad_id} onChange={e => set('especialidad_id', e.target.value)}>
              <option value="">Sin especialidad</option>
              {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Teléfono">
              <input className="input" value={values.telefono} onChange={e => set('telefono', e.target.value)} placeholder="3001234567" />
            </FormField>
            <FormField label="Email">
              <input type="email" className="input" value={values.email} onChange={e => set('email', e.target.value)} placeholder="dr@clinica.com" />
            </FormField>
          </div>

          <FormField label="Usuario del sistema vinculado">
            <select className="input" value={values.usuario_id} onChange={e => set('usuario_id', e.target.value)}>
              <option value="">Sin vincular</option>
              {usuariosProfesional.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} {u.apellido} — {u.email}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Vincula un usuario con rol "profesional" para que solo vea sus propias citas al iniciar sesión.
            </p>
          </FormField>
        {/* Acciones */}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Guardando…' : editing ? 'Actualizar' : 'Crear profesional'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}