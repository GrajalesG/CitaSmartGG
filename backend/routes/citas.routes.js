const router = require('express').Router();
const svc = require('../services/citas.service');
const db  = require('../config/db');
const { verifyToken } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

// Middleware de autenticación
const auth = [verifyToken];

// Filtro automático para profesionales
const injectProfesionalFilter = async (req, res, next) => {
  if (req.user?.rol === 'profesional') {
    console.log(`[Filter] usuario_id=${req.user.id} email=${req.user.email} rol=${req.user.rol}`);
    const [rows] = await db.query(
      'SELECT id, usuario_id FROM profesionales WHERE usuario_id = ? AND activo = 1',
      [req.user.id]
    );
    console.log(`[Filter] profesionales encontrados con usuario_id=${req.user.id}:`, rows);
    if (!rows.length) {
      const [byEmail] = await db.query(
        'SELECT id, usuario_id, email FROM profesionales WHERE email = ? AND activo = 1',
        [req.user.email]
      );
      console.log(`[Filter] fallback por email ${req.user.email}:`, byEmail);
      if (!byEmail.length) {
        return res.status(403).json({
          success: false,
          message: 'Tu usuario no tiene un profesional vinculado. Contacta al administrador.',
        });
      }
      req.query.profesional_id = byEmail[0].id;
      console.log(`[Filter] usando profesional_id=${byEmail[0].id} (por email)`);
      return next();
    }
    req.query.profesional_id = rows[0].id;
    console.log(`[Filter] usando profesional_id=${rows[0].id} (por usuario_id)`);
  }
  next();
};

// Obtener listado de citas
router.get('/',
  [...auth, injectProfesionalFilter],
  async (req, res, next) => {
    try { res.json({ success: true, data: await svc.getAll(req.query) }); } catch(e) { next(e); }
  }
);

// Obtener calendario de citas
router.get('/calendario',
  [...auth, injectProfesionalFilter],
  async (req, res, next) => {
    try { res.json({ success: true, data: await svc.getCalendario(req.query) }); } catch(e) { next(e); }
  }
);

// Obtener una cita por ID
router.get('/:id', auth, async (req, res, next) => {
  try {
    const cita = await svc.getById(req.params.id);
    // Profesional solo puede ver sus propias citas
    if (req.user?.rol === 'profesional') {
      const [rows] = await db.query(
        'SELECT id FROM profesionales WHERE usuario_id = ? AND activo = 1',
        [req.user.id]
      );
      if (!rows.length || rows[0].id !== cita.profesional_id) {
        return res.status(403).json({ success: false, message: 'Sin acceso a esta cita' });
      }
    }
    res.json({ success: true, data: cita });
  } catch(e) { next(e); }
});

//Crear una nueva cita
router.post('/',
  [...auth,
    body('paciente_id').isInt(),
    body('profesional_id').isInt(),
    body('servicio_id').isInt(),
    body('fecha_hora_inicio').isISO8601(),
    validate],
  async (req, res, next) => {
    try { res.status(201).json({ success: true, data: await svc.create(req.body, req.user.id) }); } catch(e) { next(e); }
  }
);

//Reprogramar una cita
router.put('/:id/reprogramar',
  [...auth, body('fecha_hora_inicio').isISO8601(), validate],
  async (req, res, next) => {
    try { res.json({ success: true, data: await svc.reprogramar(req.params.id, req.body, req.user.id) }); } catch(e) { next(e); }
  }
);

//Cancelar una cita
router.patch('/:id/cancelar',  auth, async (req, res, next) => {
  try { res.json({ success: true, data: await svc.cancelar(req.params.id, req.body.motivo) }); } catch(e) { next(e); }
});

//Confirmar una cita
router.patch('/:id/confirmar', auth, async (req, res, next) => {
  try { res.json({ success: true, data: await svc.confirmar(req.params.id) }); } catch(e) { next(e); }
});

//Completar una cita
router.patch('/:id/completar', auth, async (req, res, next) => {
  try { res.json({ success: true, data: await svc.completar(req.params.id, req.body.observaciones) }); } catch(e) { next(e); }
});

module.exports = router;