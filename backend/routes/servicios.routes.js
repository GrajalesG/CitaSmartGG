const router = require('express').Router();
const { servicios: svc } = require('../services/catalogs.service');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const admin = [verifyToken, requireRole('admin')];
const auth  = [verifyToken];

router.get('/',       auth,  async (req,res,next) => { try { res.json({ success:true, data: await svc.getAll() }); } catch(e){next(e);} });
router.get('/:id',    auth,  async (req,res,next) => { try { res.json({ success:true, data: await svc.getById(req.params.id) }); } catch(e){next(e);} });
router.post('/',
  [...admin, body('nombre').notEmpty(), body('duracion_minutos').isInt({ min: 5 }), validate],
  async (req,res,next) => { try { res.status(201).json({ success:true, data: await svc.create(req.body) }); } catch(e){next(e);} }
);
router.put('/:id',
  [...admin, body('nombre').notEmpty(), body('duracion_minutos').isInt({ min: 5 }), validate],
  async (req,res,next) => { try { res.json({ success:true, data: await svc.update(req.params.id, req.body) }); } catch(e){next(e);} }
);
router.delete('/:id', admin, async (req,res,next) => { try { await svc.remove(req.params.id); res.json({ success:true }); } catch(e){next(e);} });

module.exports = router;