const db = require('../config/db');

const getByProfesional = async (profesionalId) => {
  const [rows] = await db.query(
    `SELECT b.*, p.nombre AS prof_nombre, p.apellido AS prof_apellido,
            u.nombre AS creado_por_nombre
     FROM bloqueos b
     JOIN profesionales p ON p.id = b.profesional_id
     LEFT JOIN usuarios u ON u.id = b.created_by
     WHERE b.profesional_id = ? ORDER BY b.fecha_inicio DESC`,
    [profesionalId]
  );
  return rows;
};

const create = async ({ profesional_id, fecha_inicio, fecha_fin, motivo }, userId) => {
  const [r] = await db.query(
    'INSERT INTO bloqueos (profesional_id, fecha_inicio, fecha_fin, motivo, created_by) VALUES (?,?,?,?,?)',
    [profesional_id, fecha_inicio, fecha_fin, motivo || null, userId]
  );
  const [row] = await db.query('SELECT * FROM bloqueos WHERE id=?', [r.insertId]);
  return row[0];
};

const remove = async (id) => {
  const [r] = await db.query('SELECT id FROM bloqueos WHERE id=?', [id]);
  if (!r.length) throw { status: 404, message: 'Bloqueo no encontrado' };
  await db.query('DELETE FROM bloqueos WHERE id=?', [id]);
};

module.exports = { getByProfesional, create, remove };