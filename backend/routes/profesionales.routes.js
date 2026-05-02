const router = require('express').Router();
const { profesionales: svc } = require('../services/catalogs.service');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

// Middleware de acceso
//Solo administradores y personal autorizado pueden gestionarla información de profesionales
const staffOnly = [verifyToken, requireRole('admin', 'personal')];
const base = [...staffOnly, body('nombre').notEmpty(), body('apellido').notEmpty(), body('documento').notEmpty(), validate];

//Rutas de profesionales CRUD
router.get('/',       staffOnly, async (req,res,next) => { try { res.json({ success:true, data: await svc.getAll() }); } catch(e){next(e);} });
router.get('/:id',    staffOnly, async (req,res,next) => { try { res.json({ success:true, data: await svc.getById(req.params.id) }); } catch(e){next(e);} });
router.post('/',      base,      async (req,res,next) => { try { res.status(201).json({ success:true, data: await svc.create(req.body) }); } catch(e){next(e);} });
router.put('/:id',    base,      async (req,res,next) => { try { res.json({ success:true, data: await svc.update(req.params.id, req.body) }); } catch(e){next(e);} });
router.delete('/:id', staffOnly, async (req,res,next) => { try { await svc.remove(req.params.id); res.json({ success:true }); } catch(e){next(e);} });

module.exports = router;