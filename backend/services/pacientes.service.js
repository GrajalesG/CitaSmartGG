const db = require('../config/db');

const getAll = async (search = '') => {
  const q = `%${search}%`;
  const [rows] = await db.query(
    `SELECT * FROM pacientes WHERE activo = 1
     AND (nombre LIKE ? OR apellido LIKE ? OR documento LIKE ? OR email LIKE ?)
     ORDER BY apellido, nombre`,
    [q, q, q, q]
  );
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query('SELECT * FROM pacientes WHERE id = ?', [id]);
  if (!rows.length) throw { status: 404, message: 'Paciente no encontrado' };
  return rows[0];
};

const create = async (data) => {
  const [exist] = await db.query('SELECT id FROM pacientes WHERE documento = ?', [data.documento]);
  if (exist.length) throw { status: 409, message: 'Documento ya registrado' };
  const [r] = await db.query(
    `INSERT INTO pacientes (nombre, apellido, documento, tipo_documento, fecha_nacimiento, telefono, email, direccion)
     VALUES (?,?,?,?,?,?,?,?)`,
    [data.nombre, data.apellido, data.documento, data.tipo_documento || 'CC',
     data.fecha_nacimiento || null, data.telefono || null, data.email || null, data.direccion || null]
  );
  return getById(r.insertId);
};

const update = async (id, data) => {
  await getById(id);
  await db.query(
    `UPDATE pacientes SET nombre=?, apellido=?, documento=?, tipo_documento=?,
     fecha_nacimiento=?, telefono=?, email=?, direccion=? WHERE id=?`,
    [data.nombre, data.apellido, data.documento, data.tipo_documento,
     data.fecha_nacimiento || null, data.telefono || null, data.email || null,
     data.direccion || null, id]
  );
  return getById(id);
};

const remove = async (id) => {
  await db.query('UPDATE pacientes SET activo=0 WHERE id=?', [id]);
};

module.exports = { getAll, getById, create, update, remove };