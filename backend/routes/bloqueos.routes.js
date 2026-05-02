const router = require('express').Router();
const svc = require('../services/bloqueos.service');
const { verifyToken } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const auth = [verifyToken];

router.get('/profesional/:id', auth, async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getByProfesional(req.params.id) }); } catch (e) { next(e); }
});

router.post('/',
  [...auth,
    body('profesional_id').isInt(),
    body('fecha_inicio').isISO8601(),
    body('fecha_fin').isISO8601(),
    validate],
  async (req, res, next) => {
    try {
      const data = await svc.create(req.body, req.user.id);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }
);

router.delete('/:id', auth, async (req, res, next) => {
  try { await svc.remove(req.params.id); res.json({ success: true }); } catch (e) { next(e); }
});

module.exports = router;