const jwt = require('jsonwebtoken');


// Verificar token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token requerido' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalido o expirado' });
  }
};

// Validación de roles
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.rol)) {
    return res.status(403).json({ success: false, message: 'Sin permisos suficientes' });
  }
  next();
};

// Solo admin
const requireAdmin = requireRole('admin');

// Acceso permitido para personal autorizado
const requireStaff = requireRole('admin', 'personal', 'profesional');

module.exports = { verifyToken, requireRole, requireAdmin, requireStaff };