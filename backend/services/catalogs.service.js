// ===== especialidades.service.js =====
const db = require('../config/db');

const especialidades = {
  getAll: async () => {
    const [r] = await db.query('SELECT * FROM especialidades WHERE activa=1 ORDER BY nombre');
    return r;
  },
  getById: async (id) => {
    const [r] = await db.query('SELECT * FROM especialidades WHERE id=?', [id]);
    if (!r.length) throw { status: 404, message: 'Especialidad no encontrada' };
    return r[0];
  },
  create: async ({ nombre, descripcion }) => {
    const [res] = await db.query('INSERT INTO especialidades (nombre, descripcion) VALUES (?,?)', [nombre, descripcion || null]);
    return especialidades.getById(res.insertId);
  },
  update: async (id, { nombre, descripcion, activa }) => {
    await especialidades.getById(id);
    await db.query('UPDATE especialidades SET nombre=?, descripcion=?, activa=? WHERE id=?', [nombre, descripcion || null, activa ?? 1, id]);
    return especialidades.getById(id);
  },
  remove: async (id) => db.query('UPDATE especialidades SET activa=0 WHERE id=?', [id]),
};


const servicios = {
  getAll: async () => {
    const [r] = await db.query(
      `SELECT s.*, e.nombre AS especialidad_nombre FROM servicios s
       LEFT JOIN especialidades e ON e.id = s.especialidad_id
       WHERE s.activo=1 ORDER BY s.nombre`
    );
    return r;
  },
  getById: async (id) => {
    const [r] = await db.query(
      `SELECT s.*, e.nombre AS especialidad_nombre FROM servicios s
       LEFT JOIN especialidades e ON e.id = s.especialidad_id WHERE s.id=?`, [id]
    );
    if (!r.length) throw { status: 404, message: 'Servicio no encontrado' };
    return r[0];
  },
  create: async (d) => {
    const [res] = await db.query(
      'INSERT INTO servicios (nombre, descripcion, duracion_minutos, precio, especialidad_id) VALUES (?,?,?,?,?)',
      [d.nombre, d.descripcion || null, d.duracion_minutos || 30, d.precio || 0, d.especialidad_id || null]
    );
    return servicios.getById(res.insertId);
  },
  update: async (id, d) => {
    await servicios.getById(id);
    await db.query(
      'UPDATE servicios SET nombre=?, descripcion=?, duracion_minutos=?, precio=?, especialidad_id=? WHERE id=?',
      [d.nombre, d.descripcion || null, d.duracion_minutos, d.precio, d.especialidad_id || null, id]
    );
    return servicios.getById(id);
  },
  remove: async (id) => db.query('UPDATE servicios SET activo=0 WHERE id=?', [id]),
};

const profesionales = {
  getAll: async () => {
    const [r] = await db.query(
      `SELECT p.*, e.nombre AS especialidad_nombre FROM profesionales p
       LEFT JOIN especialidades e ON e.id = p.especialidad_id
       WHERE p.activo=1 ORDER BY p.apellido, p.nombre`
    );
    return r;
  },
  getById: async (id) => {
    const [r] = await db.query(
      `SELECT p.*, e.nombre AS especialidad_nombre FROM profesionales p
       LEFT JOIN especialidades e ON e.id = p.especialidad_id WHERE p.id=?`, [id]
    );
    if (!r.length) throw { status: 404, message: 'Profesional no encontrado' };
    return r[0];
  },
  create: async (d) => {
    const [ex] = await db.query('SELECT id FROM profesionales WHERE documento=?', [d.documento]);
    if (ex.length) throw { status: 409, message: 'Documento ya registrado' };
    const [res] = await db.query(
      'INSERT INTO profesionales (nombre, apellido, documento, email, telefono, especialidad_id, registro_medico) VALUES (?,?,?,?,?,?,?)',
      [d.nombre, d.apellido, d.documento, d.email || null, d.telefono || null, d.especialidad_id || null, d.registro_medico || null]
    );
    return profesionales.getById(res.insertId);
  },
  update: async (id, d) => {
    await profesionales.getById(id);
    await db.query(
      'UPDATE profesionales SET nombre=?, apellido=?, documento=?, email=?, telefono=?, especialidad_id=?, registro_medico=? WHERE id=?',
      [d.nombre, d.apellido, d.documento, d.email || null, d.telefono || null, d.especialidad_id || null, d.registro_medico || null, id]
    );
    return profesionales.getById(id);
  },
  remove: async (id) => db.query('UPDATE profesionales SET activo=0 WHERE id=?', [id]),
};

module.exports = { especialidades, servicios, profesionales };