import api from './client';

// Servicios de autenticación
// Gestiona inicio de sesión y validación de usuario
export const authApi = {
  login:  (data) => api.post('/auth/login', data),
  me:     ()     => api.get('/auth/me'),
  logout: ()     => api.post('/auth/logout'),
};

//Servicios de usuarios
export const usuariosApi = {
  getAll:   ()       => api.get('/usuarios'),
  getById:  (id)     => api.get(`/usuarios/${id}`),
  create:   (data)   => api.post('/usuarios', data),
  update:   (id,d)   => api.put(`/usuarios/${id}`, d),
  remove:   (id)     => api.delete(`/usuarios/${id}`),
  getRoles: ()       => api.get('/usuarios/roles'),
};

//Servicios de pacientes
export const pacientesApi = {
  getAll:  (search='') => api.get('/pacientes', { params: { search } }),
  getById: (id)        => api.get(`/pacientes/${id}`),
  create:  (data)      => api.post('/pacientes', data),
  update:  (id,d)      => api.put(`/pacientes/${id}`, d),
  remove:  (id)        => api.delete(`/pacientes/${id}`),
};

//Servicios de profesionales
export const profesionalesApi = {
  getAll:  ()      => api.get('/profesionales'),
  getById: (id)    => api.get(`/profesionales/${id}`),
  create:  (data)  => api.post('/profesionales', data),
  update:  (id,d)  => api.put(`/profesionales/${id}`, d),
  remove:  (id)    => api.delete(`/profesionales/${id}`),
};

//Servicios de especialidades
export const especialidadesApi = {
  getAll:  ()      => api.get('/especialidades'),
  create:  (data)  => api.post('/especialidades', data),
  update:  (id,d)  => api.put(`/especialidades/${id}`, d),
  remove:  (id)    => api.delete(`/especialidades/${id}`),
};

//Servicios de servicios médicos
export const serviciosApi = {
  getAll:  ()      => api.get('/servicios'),
  getById: (id)    => api.get(`/servicios/${id}`),
  create:  (data)  => api.post('/servicios', data),
  update:  (id,d)  => api.put(`/servicios/${id}`, d),
  remove:  (id)    => api.delete(`/servicios/${id}`),
};

//Servicios de horarios
export const horariosApi = {
  getByProfesional: (id)                   => api.get(`/horarios/profesional/${id}`),
  getDisponibilidad:(profesional_id, fecha, duracion) =>
    api.get('/horarios/disponibilidad', { params: { profesional_id, fecha, duracion } }),
  create: (data)   => api.post('/horarios', data),
  update: (id,d)   => api.put(`/horarios/${id}`, d),
  remove: (id)     => api.delete(`/horarios/${id}`),
};

//Servicios de bloqueos
export const bloqueosApi = {
  getByProfesional: (id)   => api.get(`/bloqueos/profesional/${id}`),
  create:           (data) => api.post('/bloqueos', data),
  remove:           (id)   => api.delete(`/bloqueos/${id}`),
};

//Servicios de citas
export const citasApi = {
  getAll:       (params)    => api.get('/citas', { params }),
  getById:      (id)        => api.get(`/citas/${id}`),
  getCalendario:(params)    => api.get('/citas/calendario', { params }),
  create:       (data)      => api.post('/citas', data),
  reprogramar:  (id,data)   => api.put(`/citas/${id}/reprogramar`, data),
  cancelar:     (id,motivo) => api.patch(`/citas/${id}/cancelar`, { motivo }),
  confirmar:    (id)        => api.patch(`/citas/${id}/confirmar`),
  completar:    (id,obs)    => api.patch(`/citas/${id}/completar`, { observaciones: obs }),
};