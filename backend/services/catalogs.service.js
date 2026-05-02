const db = require('../config/db');


//Servicio de especialidades

const especialidades = {
  // Obtener todas las especialidades activas
  getAll: async () => {
    const [r] = await db.query('SELECT * FROM especialidades WHERE activa=1 ORDER BY nombre');
    return r;
  },
  // Obtener una especialidad por ID
  getById: async (id) => {
    const [r] = await db.query('SELECT * FROM especialidades WHERE id=?', [id]);
    if (!r.length) throw { status: 404, message: 'Especialidad no encontrada' };
    return r[0];
  },
  // Crear una nueva especialidad
  create: async ({ nombre, descripcion }) => {
    const [res] = await db.query('INSERT INTO especialidades (nombre, descripcion) VALUES (?,?)', [nombre, descripcion || null]);
    return especialidades.getById(res.insertId);
  },
   // Actualizar una especialidad
  update: async (id, { nombre, descripcion, activa }) => {
    await especialidades.getById(id);
    await db.query('UPDATE especialidades SET nombre=?, descripcion=?, activa=? WHERE id=?', [nombre, descripcion || null, activa ?? 1, id]);
    return especialidades.getById(id);
  },
  remove: async (id) => db.query('UPDATE especialidades SET activa=0 WHERE id=?', [id]),
};

//Servicio de servicios médicos
const servicios = {
  // Obtener todos los servicios activos
  getAll: async () => {
    const [r] = await db.query(
      `SELECT s.*, e.nombre AS especialidad_nombre FROM servicios s
       LEFT JOIN especialidades e ON e.id = s.especialidad_id
       WHERE s.activo=1 ORDER BY s.nombre`
    );
    return r;
  },
  // Obtener un servicio por ID
  getById: async (id) => {
    const [r] = await db.query(
      `SELECT s.*, e.nombre AS especialidad_nombre FROM servicios s
       LEFT JOIN especialidades e ON e.id = s.especialidad_id WHERE s.id=?`, [id]
    );
    if (!r.length) throw { status: 404, message: 'Servicio no encontrado' };
    return r[0];
  },
  // Crear un nuevo servicio
  create: async (d) => {
    const [res] = await db.query(
      'INSERT INTO servicios (nombre, descripcion, duracion_minutos, precio, especialidad_id) VALUES (?,?,?,?,?)',
      [d.nombre, d.descripcion || null, d.duracion_minutos || 30, d.precio || 0, d.especialidad_id || null]
    );
    return servicios.getById(res.insertId);
  },
   // Actualizar un servicio
  update: async (id, d) => {
    await servicios.getById(id);
    await db.query(
      'UPDATE servicios SET nombre=?, descripcion=?, duracion_minutos=?, precio=?, especialidad_id=? WHERE id=?',
      [d.nombre, d.descripcion || null, d.duracion_minutos, d.precio, d.especialidad_id || null, id]
    );
    return servicios.getById(id);
  },
   // Desactivar un servicio
  remove: async (id) => db.query('UPDATE servicios SET activo=0 WHERE id=?', [id]),
};

//Servicio de profesionales
const profesionales = {
   // Obtener todos los profesionales activos
  getAll: async () => {
    const [r] = await db.query(
      `SELECT p.*, e.nombre AS especialidad_nombre, u.email AS usuario_email
       FROM profesionales p
       LEFT JOIN especialidades e ON e.id = p.especialidad_id
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.activo=1 ORDER BY p.apellido, p.nombre`
    );
    return r;
  },
  // Obtener un profesional por ID
  getById: async (id) => {
    const [r] = await db.query(
      `SELECT p.*, e.nombre AS especialidad_nombre, u.email AS usuario_email
       FROM profesionales p
       LEFT JOIN especialidades e ON e.id = p.especialidad_id
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.id=?`, [id]
    );
    if (!r.length) throw { status: 404, message: 'Profesional no encontrado' };
    return r[0];
  },
  // Crear un nuevo profesional
  create: async (d) => {
    // Validar documento duplicado
    const [ex] = await db.query('SELECT id FROM profesionales WHERE documento=?', [d.documento]);
    if (ex.length) throw { status: 409, message: 'Documento ya registrado' };
    const [res] = await db.query(
      'INSERT INTO profesionales (nombre, apellido, documento, email, telefono, especialidad_id, registro_medico, usuario_id) VALUES (?,?,?,?,?,?,?,?)',
      [d.nombre, d.apellido, d.documento, d.email || null, d.telefono || null,
       d.especialidad_id || null, d.registro_medico || null, d.usuario_id || null]
    );
    return profesionales.getById(res.insertId);
  },
  // Actualizar información de un profesional
  update: async (id, d) => {
    await profesionales.getById(id);
    await db.query(
      'UPDATE profesionales SET nombre=?, apellido=?, documento=?, email=?, telefono=?, especialidad_id=?, registro_medico=?, usuario_id=? WHERE id=?',
      [d.nombre, d.apellido, d.documento, d.email || null, d.telefono || null,
       d.especialidad_id || null, d.registro_medico || null, d.usuario_id || null, id]
    );
    return profesionales.getById(id);
  },
  // Desactivar un profesional
  remove: async (id) => db.query('UPDATE profesionales SET activo=0 WHERE id=?', [id]),
};

module.exports = { especialidades, servicios, profesionales };