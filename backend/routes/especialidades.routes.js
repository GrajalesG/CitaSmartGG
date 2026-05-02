const router1 = require('express').Router();
const { especialidades: svc } = require('../services/catalogs.service');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

//Middleware de acceso
const admin = [verifyToken, requireRole('admin')];
const auth  = [verifyToken];

//Rutas de especialidades CRUD
router1.get('/',       auth,  async (req,res,next) => { try { res.json({ success:true, data: await svc.getAll() }); } catch(e){next(e);} });
router1.get('/:id',    auth,  async (req,res,next) => { try { res.json({ success:true, data: await svc.getById(req.params.id) }); } catch(e){next(e);} });
router1.post('/',      [...admin, body('nombre').notEmpty(), validate], async (req,res,next) => { try { res.status(201).json({ success:true, data: await svc.create(req.body) }); } catch(e){next(e);} });
router1.put('/:id',    [...admin, body('nombre').notEmpty(), validate], async (req,res,next) => { try { res.json({ success:true, data: await svc.update(req.params.id, req.body) }); } catch(e){next(e);} });
router1.delete('/:id', admin, async (req,res,next) => { try { await svc.remove(req.params.id); res.json({ success:true }); } catch(e){next(e);} });

module.exports = router1;