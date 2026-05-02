const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// Rutas de autenticación
//  Iniciar sesión
router.post('/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  validate,
  ctrl.login
);

router.get('/me', verifyToken, ctrl.me);
router.post('/logout', verifyToken, ctrl.logout);

module.exports = router;