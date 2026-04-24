const db = require('../config/db');

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

const getByProfesional = async (profesionalId) => {
  const [rows] = await db.query(
    `SELECT h.*, p.nombre AS prof_nombre, p.apellido AS prof_apellido
     FROM horarios h JOIN profesionales p ON p.id = h.profesional_id
     WHERE h.profesional_id = ? ORDER BY h.dia_semana, h.hora_inicio`,
    [profesionalId]
  );
  return rows;
};

const create = async ({ profesional_id, dia_semana, hora_inicio, hora_fin }) => {
  // Validar solapamiento en mismo día
  const [overlap] = await db.query(
    `SELECT id FROM horarios WHERE profesional_id=? AND dia_semana=? AND activo=1
     AND NOT (hora_fin <= ? OR hora_inicio >= ?)`,
    [profesional_id, dia_semana, hora_inicio, hora_fin]
  );
  if (overlap.length) throw { status: 409, message: 'El horario se solapa con uno existente' };

  const [r] = await db.query(
    'INSERT INTO horarios (profesional_id, dia_semana, hora_inicio, hora_fin) VALUES (?,?,?,?)',
    [profesional_id, dia_semana, hora_inicio, hora_fin]
  );
  const [row] = await db.query('SELECT * FROM horarios WHERE id=?', [r.insertId]);
  return row[0];
};

const update = async (id, { hora_inicio, hora_fin, activo }) => {
  const [cur] = await db.query('SELECT * FROM horarios WHERE id=?', [id]);
  if (!cur.length) throw { status: 404, message: 'Horario no encontrado' };

  await db.query(
    'UPDATE horarios SET hora_inicio=?, hora_fin=?, activo=? WHERE id=?',
    [hora_inicio, hora_fin, activo ?? 1, id]
  );
  const [row] = await db.query('SELECT * FROM horarios WHERE id=?', [id]);
  return row[0];
};

const remove = async (id) => {
  await db.query('DELETE FROM horarios WHERE id=?', [id]);
};

/**
 * Retorna slots disponibles para un profesional en una fecha dada
 * considerando horario semanal, bloqueos y citas existentes
 */
const getDisponibilidad = async (profesionalId, fecha, duracionMinutos = 30) => {
  const date = new Date(fecha + 'T00:00:00');
  const diaSemana = date.getDay();

  // 1. Obtener horarios del día
  const [horarios] = await db.query(
    `SELECT hora_inicio, hora_fin FROM horarios
     WHERE profesional_id=? AND dia_semana=? AND activo=1`,
    [profesionalId, diaSemana]
  );
  if (!horarios.length) return [];

  // 2. Obtener bloqueos del día
  const [bloqueos] = await db.query(
    `SELECT fecha_inicio, fecha_fin FROM bloqueos
     WHERE profesional_id=?
     AND DATE(fecha_inicio) <= ? AND DATE(fecha_fin) >= ?`,
    [profesionalId, fecha, fecha]
  );

  // 3. Obtener citas del día (no canceladas)
  const [citas] = await db.query(
    `SELECT fecha_hora_inicio, fecha_hora_fin FROM citas
     WHERE profesional_id=? AND DATE(fecha_hora_inicio)=?
     AND estado NOT IN ('cancelada')`,
    [profesionalId, fecha]
  );

  const slots = [];

  for (const h of horarios) {
    const [hIni, mIni] = h.hora_inicio.split(':').map(Number);
    const [hFin, mFin] = h.hora_fin.split(':').map(Number);

    let cursor = hIni * 60 + mIni;
    const end = hFin * 60 + mFin;

    while (cursor + duracionMinutos <= end) {
      const slotIni = minutesToTime(cursor);
      const slotFin = minutesToTime(cursor + duracionMinutos);
      const dtIni = `${fecha} ${slotIni}:00`;
      const dtFin = `${fecha} ${slotFin}:00`;

      const bloqueado = bloqueos.some(b =>
        new Date(b.fecha_inicio) < new Date(dtFin) &&
        new Date(b.fecha_fin) > new Date(dtIni)
      );

      const ocupado = citas.some(c =>
        new Date(c.fecha_hora_inicio) < new Date(dtFin) &&
        new Date(c.fecha_hora_fin) > new Date(dtIni)
      );

      if (!bloqueado && !ocupado) {
        slots.push({ hora_inicio: slotIni, hora_fin: slotFin });
      }

      cursor += duracionMinutos;
    }
  }

  return slots;
};

const minutesToTime = (m) => {
  const h = String(Math.floor(m / 60)).padStart(2, '0');
  const min = String(m % 60).padStart(2, '0');
  return `${h}:${min}`;
};

module.exports = { getByProfesional, create, update, remove, getDisponibilidad };