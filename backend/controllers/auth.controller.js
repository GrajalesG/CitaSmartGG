const authService = require('../services/auth.service');

// Iniciar sesión
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// información del usuario autenticado
const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// Cerrar sesión
const logout = (req, res) => res.json({ success: true, message: 'Sesión cerrada' });

module.exports = { login, me, logout };