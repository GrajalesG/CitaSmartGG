const bcrypt = require('bcrypt');
const db = require('../config/db');

//Obtener listado de usuarios
const getAll = async () => {
  const [rows] = await db.query(
    `SELECT u.id, u.nombre, u.apellido, u.email, u.activo, r.nombre AS rol, u.created_at
     FROM usuarios u JOIN roles r ON r.id = u.rol_id ORDER BY u.id DESC`
  );
  return rows;
};

// Obtener un usuario por ID
const getById = async (id) => {
  const [rows] = await db.query(
    `SELECT u.id, u.nombre, u.apellido, u.email, u.activo, u.rol_id, r.nombre AS rol
     FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.id = ?`, [id]
  );
  if (!rows.length) throw { status: 404, message: 'Usuario no encontrado' };
  return rows[0];
};

// Crear un nuevo usuario
const create = async ({ nombre, apellido, email, password, rol_id }) => {
   // Validar email duplicado
  const [exist] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (exist.length) throw { status: 409, message: 'Email ya registrado' };
  // Encriptar contraseña 
  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id) VALUES (?,?,?,?,?)',
    [nombre, apellido, email, hash, rol_id]
  );
  return getById(result.insertId);
};

// Actualizar información de un usuario
const update = async (id, { nombre, apellido, email, rol_id, activo }) => {
  await getById(id);
  await db.query(
    'UPDATE usuarios SET nombre=?, apellido=?, email=?, rol_id=?, activo=? WHERE id=?',
    [nombre, apellido, email, rol_id, activo, id]
  );
  return getById(id);
};

//Cambiar contraseña de usuario
const changePassword = async (id, newPassword) => {
  // Encriptar nueva contraseña
  const hash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE usuarios SET password_hash=? WHERE id=?', [hash, id]);
};

//Desactivar un usuario
const remove = async (id) => {
  await db.query('UPDATE usuarios SET activo=0 WHERE id=?', [id]);
};

// Obtener roles disponibles
const getRoles = async () => {
  const [rows] = await db.query('SELECT * FROM roles');
  return rows;
};

module.exports = { getAll, getById, create, update, changePassword, remove, getRoles };