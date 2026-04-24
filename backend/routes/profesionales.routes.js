const router = require('express').Router();
const { profesionales: svc } = require('../services/catalogs.service');
const { verifyToken } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const auth = [verifyToken];
const base = [...auth, body('nombre').notEmpty(), body('apellido').notEmpty(), body('documento').notEmpty(), validate];

router.get('/',       auth, async (req,res,next) => { try { res.json({ success:true, data: await svc.getAll() }); } catch(e){next(e);} });
router.get('/:id',    auth, async (req,res,next) => { try { res.json({ success:true, data: await svc.getById(req.params.id) }); } catch(e){next(e);} });
router.post('/',      base, async (req,res,next) => { try { res.status(201).json({ success:true, data: await svc.create(req.body) }); } catch(e){next(e);} });
router.put('/:id',    base, async (req,res,next) => { try { res.json({ success:true, data: await svc.update(req.params.id, req.body) }); } catch(e){next(e);} });
router.delete('/:id', auth, async (req,res,next) => { try { await svc.remove(req.params.id); res.json({ success:true }); } catch(e){next(e);} });

module.exports = router;