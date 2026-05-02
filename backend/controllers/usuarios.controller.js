const svc = require('../services/usuarios.service');

// listado de usuarios
const getAll = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getAll() }); } catch (e) { next(e); }
};
// usuario por ID
const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getById(req.params.id) }); } catch (e) { next(e); }
};
//nuevo usuario
const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.create(req.body) }); } catch (e) { next(e); }
};
// Actualizar información de un usuario
const update = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.update(req.params.id, req.body) }); } catch (e) { next(e); }
};
//Desactivar un usuario
const remove = async (req, res, next) => {
  try { await svc.remove(req.params.id); res.json({ success: true, message: 'Usuario desactivado' }); } catch (e) { next(e); }
};
//roles disponibles del sistema
const getRoles = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getRoles() }); } catch (e) { next(e); }
};

module.exports = { getAll, getById, create, update, remove, getRoles };