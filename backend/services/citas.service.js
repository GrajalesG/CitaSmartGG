const db = require('../config/db');

// Consulta base de citas
const BASE_SELECT = `
  SELECT c.*,
    CONCAT(p.nombre,' ',p.apellido) AS paciente_nombre, p.documento AS paciente_documento,
    CONCAT(pr.nombre,' ',pr.apellido) AS profesional_nombre,
    s.nombre AS servicio_nombre, s.duracion_minutos,
    CONCAT(u.nombre,' ',u.apellido) AS creado_por
  FROM citas c
  JOIN pacientes p ON p.id = c.paciente_id
  JOIN profesionales pr ON pr.id = c.profesional_id
  JOIN servicios s ON s.id = c.servicio_id
  LEFT JOIN usuarios u ON u.id = c.created_by
`;
//Obtener listado de citas
const getAll = async ({ fecha_inicio, fecha_fin, profesional_id, paciente_id, estado }) => {
  let where = 'WHERE 1=1';
  const params = [];
 // Aplicar filtros dinámicos
  if (fecha_inicio) { where += ' AND DATE(c.fecha_hora_inicio) >= ?'; params.push(fecha_inicio); }
  if (fecha_fin)    { where += ' AND DATE(c.fecha_hora_inicio) <= ?'; params.push(fecha_fin); }
  if (profesional_id) { where += ' AND c.profesional_id = ?'; params.push(profesional_id); }
  if (paciente_id)    { where += ' AND c.paciente_id = ?'; params.push(paciente_id); }
  if (estado)         { where += ' AND c.estado = ?'; params.push(estado); }

  const [rows] = await db.query(`${BASE_SELECT} ${where} ORDER BY c.fecha_hora_inicio DESC`, params);
  return rows;
};

//Obtener una cita por ID
const getById = async (id) => {
  const [rows] = await db.query(`${BASE_SELECT} WHERE c.id = ?`, [id]);
  if (!rows.length) throw { status: 404, message: 'Cita no encontrada' };
  return rows[0];
};

// Validar conflictos de horario
// Verifica si el profesional ya tiene una cita asignada en el mismo rango de tiempo.
const checkConflict = async (profesionalId, fechaIni, fechaFin, excludeId = null) => {
  let q = `SELECT id FROM citas
    WHERE profesional_id = ?
    AND estado NOT IN ('cancelada')
    AND fecha_hora_inicio < ? AND fecha_hora_fin > ?`;
  const params = [profesionalId, fechaFin, fechaIni];

  // Excluir cita actual en reprogramaciones
  if (excludeId) { q += ' AND id != ?'; params.push(excludeId); }

  const [rows] = await db.query(q, params);
  return rows.length > 0;
};

//Validar bloqueos de horario
const checkBloqueo = async (profesionalId, fechaIni, fechaFin) => {
  const [rows] = await db.query(
    `SELECT id FROM bloqueos
     WHERE profesional_id = ? AND fecha_inicio < ? AND fecha_fin > ?`,
    [profesionalId, fechaFin, fechaIni]
  );
  return rows.length > 0;
};

//Crear una nueva cita
const create = async (data, userId) => {
  const { paciente_id, profesional_id, servicio_id, fecha_hora_inicio, motivo_consulta } = data;

  // Obtener duración del servicio
  const [srv] = await db.query('SELECT duracion_minutos FROM servicios WHERE id=?', [servicio_id]);
  if (!srv.length) throw { status: 404, message: 'Servicio no encontrado' };

  // Calcular fecha final de la cita
  const inicio = new Date(fecha_hora_inicio);
  const fin = new Date(inicio.getTime() + srv[0].duracion_minutos * 60000);
  const fechaIniStr = inicio.toISOString().slice(0, 19).replace('T', ' ');
  const fechaFinStr = fin.toISOString().slice(0, 19).replace('T', ' ');

  // Validar horario del profesional
  const diaSemana = inicio.getDay();
  const horaStr = inicio.toTimeString().slice(0, 5);
  const [horario] = await db.query(
    `SELECT id FROM horarios WHERE profesional_id=? AND dia_semana=? AND activo=1
     AND hora_inicio <= ? AND hora_fin >= ?`,
    [profesional_id, diaSemana, horaStr, fin.toTimeString().slice(0, 5)]
  );
  if (!horario.length) throw { status: 422, message: 'El profesional no tiene horario en ese momento' };

  // Validar bloqueos
  if (await checkBloqueo(profesional_id, fechaIniStr, fechaFinStr))
    throw { status: 422, message: 'El profesional tiene un bloqueo en ese horario' };
// Validar conflictos
  if (await checkConflict(profesional_id, fechaIniStr, fechaFinStr))
    throw { status: 422, message: 'Ya existe una cita en ese horario para este profesional' };
// Registrar cita
  const [r] = await db.query(
    `INSERT INTO citas (paciente_id, profesional_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, motivo_consulta, created_by)
     VALUES (?,?,?,?,?,?,?)`,
    [paciente_id, profesional_id, servicio_id, fechaIniStr, fechaFinStr, motivo_consulta || null, userId]
  );
  return getById(r.insertId);
};

// Reprogramar una cita
const reprogramar = async (id, { fecha_hora_inicio, motivo_consulta }, userId) => {
  const cita = await getById(id);
  // Validar estado de la cita
  if (['cancelada', 'completada'].includes(cita.estado))
    throw { status: 422, message: `No se puede reprogramar una cita ${cita.estado}` };

 // Obtener duración del servicio
  const [srv] = await db.query('SELECT duracion_minutos FROM servicios WHERE id=?', [cita.servicio_id]);
  const inicio = new Date(fecha_hora_inicio);
  const fin = new Date(inicio.getTime() + srv[0].duracion_minutos * 60000);
  const fechaIniStr = inicio.toISOString().slice(0, 19).replace('T', ' ');
  const fechaFinStr = fin.toISOString().slice(0, 19).replace('T', ' ');

   // Validar bloqueos
  if (await checkBloqueo(cita.profesional_id, fechaIniStr, fechaFinStr))
    throw { status: 422, message: 'El profesional tiene un bloqueo en ese horario' };

  // Validar conflictos
  if (await checkConflict(cita.profesional_id, fechaIniStr, fechaFinStr, id))
    throw { status: 422, message: 'Ya existe una cita en ese horario para este profesional' };
 // Actualizar cita
  await db.query(
    `UPDATE citas SET fecha_hora_inicio=?, fecha_hora_fin=?, motivo_consulta=?, estado='agendada', updated_at=NOW()
     WHERE id=?`,
    [fechaIniStr, fechaFinStr, motivo_consulta || cita.motivo_consulta, id]
  );
  return getById(id);
};

// Cambiar estado de una cita
const cambiarEstado = async (id, estado, motivo_cancelacion = null) => {
  const cita = await getById(id);
   // Validar si la cita ya fue cancelada
  if (cita.estado === 'cancelada') throw { status: 422, message: 'La cita ya está cancelada' };

  await db.query(
    'UPDATE citas SET estado=?, motivo_cancelacion=?, updated_at=NOW() WHERE id=?',
    [estado, motivo_cancelacion, id]
  );
  return getById(id);
};
//  Acciones sobre citas
const cancelar = async (id, motivo) => cambiarEstado(id, 'cancelada', motivo);
const confirmar = async (id) => cambiarEstado(id, 'confirmada');
const completar = async (id, observaciones) => {
  await db.query('UPDATE citas SET estado=?, observaciones=?, updated_at=NOW() WHERE id=?',
    ['completada', observaciones || null, id]);
  return getById(id);
};

// Para el calendario: retorna citas en rango por mes
const getCalendario = async ({ year, month, profesional_id }) => {
  const inicio = `${year}-${String(month).padStart(2,'0')}-01`;
  const fin = new Date(year, month, 0);
  const finStr = `${year}-${String(month).padStart(2,'0')}-${fin.getDate()}`;

  let where = `WHERE DATE(c.fecha_hora_inicio) BETWEEN ? AND ?`;
  const params = [inicio, finStr];
  // Filtrar por profesional
  if (profesional_id) { where += ' AND c.profesional_id = ?'; params.push(profesional_id); }

  const [rows] = await db.query(`${BASE_SELECT} ${where} ORDER BY c.fecha_hora_inicio`, params);
  return rows;
};

module.exports = { getAll, getById, create, reprogramar, cancelar, confirmar, completar, getCalendario };