const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const login = async (email, password) => {
  const [rows] = await db.query(
    `SELECT u.*, r.nombre AS rol FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.email = ? AND u.activo = 1`,
    [email]
  );

  if (!rows.length) throw { status: 401, message: 'Credenciales incorrectas' };
  const user = rows[0];

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Credenciales incorrectas' };

  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    token,
    user: { id: user.id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol },
  };
};

const getMe = async (userId) => {
  const [rows] = await db.query(
    `SELECT u.id, u.nombre, u.apellido, u.email, r.nombre AS rol
     FROM usuarios u JOIN roles r ON r.id = u.rol_id
     WHERE u.id = ? AND u.activo = 1`,
    [userId]
  );
  if (!rows.length) throw { status: 404, message: 'Usuario no encontrado' };
  return rows[0];
};

module.exports = { login, getMe };