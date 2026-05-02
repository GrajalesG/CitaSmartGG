const svc = require('../services/pacientes.service');

// Listado de pacientes
const getAll = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getAll(req.query.search || '') }); } catch (e) { next(e); }
};

// Paciente por ID
const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getById(req.params.id) }); } catch (e) { next(e); }
};

// Crear un nuevo paciente
const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.create(req.body) }); } catch (e) { next(e); }
};
//Actualizar información de un paciente
const update = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.update(req.params.id, req.body) }); } catch (e) { next(e); }
};
// Eliminar un paciente
const remove = async (req, res, next) => {
  try { await svc.remove(req.params.id); res.json({ success: true }); } catch (e) { next(e); }
};

module.exports = { getAll, getById, create, update, remove };