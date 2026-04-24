import api from './client';

// AUTH
export const authApi = {
  login:  (data) => api.post('/auth/login', data),
  me:     ()     => api.get('/auth/me'),
  logout: ()     => api.post('/auth/logout'),
};

// USUARIOS
export const usuariosApi = {
  getAll:   ()       => api.get('/usuarios'),
  getById:  (id)     => api.get(`/usuarios/${id}`),
  create:   (data)   => api.post('/usuarios', data),
  update:   (id,d)   => api.put(`/usuarios/${id}`, d),
  remove:   (id)     => api.delete(`/usuarios/${id}`),
  getRoles: ()       => api.get('/usuarios/roles'),
};

// PACIENTES
export const pacientesApi = {
  getAll:  (search='') => api.get('/pacientes', { params: { search } }),
  getById: (id)        => api.get(`/pacientes/${id}`),
  create:  (data)      => api.post('/pacientes', data),
  update:  (id,d)      => api.put(`/pacientes/${id}`, d),
  remove:  (id)        => api.delete(`/pacientes/${id}`),
};

// PROFESIONALES
export const profesionalesApi = {
  getAll:  ()      => api.get('/profesionales'),
  getById: (id)    => api.get(`/profesionales/${id}`),
  create:  (data)  => api.post('/profesionales', data),
  update:  (id,d)  => api.put(`/profesionales/${id}`, d),
  remove:  (id)    => api.delete(`/profesionales/${id}`),
};

// ESPECIALIDADES
export const especialidadesApi = {
  getAll:  ()      => api.get('/especialidades'),
  create:  (data)  => api.post('/especialidades', data),
  update:  (id,d)  => api.put(`/especialidades/${id}`, d),
  remove:  (id)    => api.delete(`/especialidades/${id}`),
};

// SERVICIOS
export const serviciosApi = {
  getAll:  ()      => api.get('/servicios'),
  getById: (id)    => api.get(`/servicios/${id}`),
  create:  (data)  => api.post('/servicios', data),
  update:  (id,d)  => api.put(`/servicios/${id}`, d),
  remove:  (id)    => api.delete(`/servicios/${id}`),
};

// HORARIOS
export const horariosApi = {
  getByProfesional: (id)                   => api.get(`/horarios/profesional/${id}`),
  getDisponibilidad:(profesional_id, fecha, duracion) =>
    api.get('/horarios/disponibilidad', { params: { profesional_id, fecha, duracion } }),
  create: (data)   => api.post('/horarios', data),
  update: (id,d)   => api.put(`/horarios/${id}`, d),
  remove: (id)     => api.delete(`/horarios/${id}`),
};

