import { useState } from 'react';


//Componente Modal
//Ventana reutilizable para formularios y contenido dinámico.
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  // Tamaños disponibles del modal
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className={`bg-white rounded-xl shadow-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
         {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
         {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

//Diálogo de confirmación
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirmar'} size="sm">
      <p className="text-slate-600 mb-6">{message}</p>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>Confirmar</button>
      </div>
    </Modal>
  );
}

//Tabla reutilizable
//Muestra información tabular con soporte para carga y estado vacío.
export function Table({ columns, data, loading, emptyMsg = 'Sin registros' }) {
  // Indicador de carga
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"/>
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map(c => (
              <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {!data?.length
            ? <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">{emptyMsg}</td></tr>
            : data.map((row, i) => (
              <tr key={row.id ?? i} className="hover:bg-slate-50/60 transition-colors">
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {c.render ? c.render(row) : row[c.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

// Encabezado de página
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

//Campo de búsqueda reutilizable
export function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 w-64"
      />
    </div>
  );
}

//Tarjeta estadística
export function StatCard({ label, value, icon, color = 'brand' }) {
  // Variantes de color
  const colors = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

//Etiqueta visual para estados
export function BadgeEstado({ estado }) {
  return <span className={`badge-${estado}`}>{estado?.replace('_', ' ')}</span>;
}

//Campo de formulario reutilizable
export function FormField({ label, error, required, children }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}