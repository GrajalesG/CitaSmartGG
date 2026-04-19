const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/pacientes.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const auth = [verifyToken];
const createValidation = [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('apellido').notEmpty().withMessage('Apellido requerido'),
  body('documento').notEmpty().withMessage('Documento requerido'),
  validate,
];

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', [...auth, ...createValidation], ctrl.create);
router.put('/:id', [...auth, ...createValidation], ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;