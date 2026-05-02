const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/usuarios.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

//Middleware de acceso
const adminOnly = [verifyToken, requireRole('admin')];
const authAll = [verifyToken];

//Rutas de usuarios y roles - CRUD
router.get('/roles', authAll, ctrl.getRoles);
router.get('/', adminOnly, ctrl.getAll);
router.get('/:id', authAll, ctrl.getById);

//Crear un nuevo usuario
router.post('/',
  [...adminOnly,
    body('nombre').notEmpty(), body('apellido').notEmpty(),
    body('email').isEmail(), body('password').isLength({ min: 6 }),
    body('rol_id').isInt(), validate],
  ctrl.create
);

//Crear un nuevo usuario
router.put('/:id',
  [...adminOnly,
    body('nombre').notEmpty(), body('apellido').notEmpty(),
    body('email').isEmail(), body('rol_id').isInt(), validate],
  ctrl.update
);

router.delete('/:id', adminOnly, ctrl.remove);

module.exports = router;