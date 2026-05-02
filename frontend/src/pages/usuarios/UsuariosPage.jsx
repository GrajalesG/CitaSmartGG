import { useState } from 'react';
import { usuariosApi } from '../../api/services';
import { PageHeader, Table, Modal, FormField, ConfirmDialog } from '../../components/ui';
import { useFetch, useForm } from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Estado inicial del formulario
const EMPTY = { nombre:'', apellido:'', email:'', password:'', rol_id:'1', activo: true };

export default function UsuariosPage() {
   // Usuario autenticado (para evitar auto-modificaciones)
  const { user: me } = useAuth();
  const { data: usuarios, loading, reload } = useFetch(() => usuariosApi.getAll());
  const { data: roles }                     = useFetch(() => usuariosApi.getRoles());
  const [modal, setModal]                   = useState(false);
  const [editing, setEditing]               = useState(null);
  const [delConfirm, setDelConfirm]         = useState(null);
  const [showPass, setShowPass]             = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const { values, errors, set, setAll, reset, setErrors } = useForm(EMPTY);

  const openNew  = () => { reset(); setEditing(null); setShowPass(false); setModal(true); };
  const openEdit = (u) => {
    setEditing(u);
    setAll({ nombre: u.nombre, apellido: u.apellido, email: u.email, password: '', rol_id: String(u.rol_id), activo: u.activo });
    setShowPass(false);
    setModal(true);
  };
  // Validación básica del formulario
  const validate = () => {
    const e = {};
    if (!values.nombre.trim())   e.nombre  = 'Requerido';
    if (!values.apellido.trim()) e.apellido = 'Requerido';
    if (!values.email.trim())    e.email   = 'Requerido';
    else if (!/\S+@\S+\.\S+/.test(values.email)) e.email = 'Email inválido';
    if (!editing && !values.password) e.password = 'Contraseña requerida';
    if (!editing && values.password && values.password.length < 6) e.password = 'Mínimo 6 caracteres';
    setErrors(e); return !Object.keys(e).length;
  };

   // Crear o actualizar usuario
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const body = {
      nombre: values.nombre, apellido: values.apellido,
      email: values.email, rol_id: Number(values.rol_id),
      activo: values.activo,
      ...(values.password ? { password: values.password } : {}),
    };
    try {
      if (editing) { await usuariosApi.update(editing.id, body); toast.success('Usuario actualizado'); }
      else         { await usuariosApi.create(body);             toast.success('Usuario creado'); }
      setModal(false); reload();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setSubmitting(false); }
  };

   // Desactivar usuario
  const handleDeactivate = async () => {
    try {
      await usuariosApi.remove(delConfirm.id);
      toast.success('Usuario desactivado');
      setDelConfirm(null); reload();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
  };

  const ROL_COLORS = {
    admin:    'bg-purple-50 text-purple-700',
    personal: 'bg-blue-50 text-blue-700',
  };

  const cols = [
    { key: 'nombre', label: 'Usuario', render: r => (
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          r.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-brand-100 text-brand-700'
        }`}>
          {r.nombre[0]}{r.apellido[0]}
        </div>
        <div>
          <p className="font-medium text-sm">{r.nombre} {r.apellido}</p>
          <p className="text-xs text-slate-400">{r.email}</p>
        </div>
      </div>
    )},
    { key: 'rol', label: 'Rol', render: r => (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${ROL_COLORS[r.rol] || 'bg-slate-100 text-slate-600'}`}>
        {r.rol}
      </span>
    )},
    { key: 'activo', label: 'Estado', render: r => (
      r.activo
        ? <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">Activo</span>
        : <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">Inactivo</span>
    )},
    { key: 'created_at', label: 'Creado', render: r => (
      <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('es-CO')}</span>
    )},
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1.5">
        <button onClick={() => openEdit(r)}
          className="text-xs px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
          Editar
        </button>
        {r.id !== me?.id && r.activo && (
          <button onClick={() => setDelConfirm(r)}
            className="text-xs px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
            Desactivar
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuarios del sistema"
        subtitle="Acceso y roles de la aplicación"
        action={<button className="btn-primary" onClick={openNew}>+ Nuevo usuario</button>}
      />
   {/* Tabla principal */}
      <div className="card overflow-hidden">
        <Table columns={cols} data={usuarios} loading={loading} emptyMsg="Sin usuarios registrados" />
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar usuario' : 'Nuevo usuario'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre" required error={errors.nombre}>
              <input className="input" value={values.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan" />
            </FormField>
            <FormField label="Apellido" required error={errors.apellido}>
              <input className="input" value={values.apellido} onChange={e => set('apellido', e.target.value)} placeholder="Pérez" />
            </FormField>
          </div>
          <FormField label="Email" required error={errors.email}>
            <input type="email" className="input" value={values.email}
              onChange={e => set('email', e.target.value)} placeholder="usuario@dominio.com" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Rol">
              <select className="input" value={values.rol_id} onChange={e => set('rol_id', e.target.value)}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </FormField>
            {editing && (
              <FormField label="Estado">
                <select className="input" value={values.activo ? '1' : '0'}
                  onChange={e => set('activo', e.target.value === '1')}>
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
              </FormField>
            )}
          </div>
          <FormField label={editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'} required={!editing} error={errors.password}>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="input pr-16"
                value={values.password}
                onChange={e => set('password', e.target.value)}
                placeholder={editing ? 'Nueva contraseña…' : 'Mínimo 6 caracteres'}
              />
              <button type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
                onClick={() => setShowPass(v => !v)}>
                {showPass ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </FormField>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Guardando…' : editing ? 'Actualizar' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </Modal>

 {/* Confirmación de desactivación */}
      <ConfirmDialog
        open={!!delConfirm} danger
        title="Desactivar usuario"
        message={`¿Desactivar al usuario ${delConfirm?.nombre} ${delConfirm?.apellido}? Ya no podrá iniciar sesión.`}
        onClose={() => setDelConfirm(null)}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}