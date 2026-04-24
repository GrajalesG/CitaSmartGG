const router = require('express').Router();
const svc = require('../services/horarios.service');
const { verifyToken } = require('../middleware/auth.middleware');
const { body, query } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const auth = [verifyToken];

// Disponibilidad
router.get('/disponibilidad',
  [...auth, query('profesional_id').isInt(), query('fecha').isDate(), validate],
  async (req, res, next) => {
    try {
      const { profesional_id, fecha, duracion } = req.query;
      const slots = await svc.getDisponibilidad(profesional_id, fecha, Number(duracion) || 30);
      res.json({ success: true, data: slots });
    } catch (e) { next(e); }
  }
);

// Por profesional
router.get('/profesional/:id', auth, async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getByProfesional(req.params.id) }); } catch (e) { next(e); }
});

router.post('/',
  [...auth,
    body('profesional_id').isInt(),
    body('dia_semana').isInt({ min: 0, max: 6 }),
    body('hora_inicio').matches(/^\d{2}:\d{2}$/),
    body('hora_fin').matches(/^\d{2}:\d{2}$/),
    validate],
  async (req, res, next) => {
    try { res.status(201).json({ success: true, data: await svc.create(req.body) }); } catch (e) { next(e); }
  }
);

router.put('/:id',
  [...auth,
    body('hora_inicio').matches(/^\d{2}:\d{2}$/),
    body('hora_fin').matches(/^\d{2}:\d{2}$/),
    validate],
  async (req, res, next) => {
    try { res.json({ success: true, data: await svc.update(req.params.id, req.body) }); } catch (e) { next(e); }
  }
);

router.delete('/:id', auth, async (req, res, next) => {
  try { await svc.remove(req.params.id); res.json({ success: true }); } catch (e) { next(e); }
});

module.exports = router;