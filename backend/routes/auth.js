const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
        body('password').notEmpty().withMessage('Senha é obrigatória')
    ],
    authController.login
);

router.post(
    '/register',
    [
        body('name').notEmpty().trim().escape().withMessage('Nome é obrigatório'),
        body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
        body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
        body('role').optional().isIn(['admin', 'teacher', 'user']).withMessage('Role inválida')
    ],
    authController.register
);

router.get('/me', auth(), authController.getMe);
router.get('/verify', auth(), authController.verifyToken);
router.post('/logout', auth(), authController.logout);

module.exports = router;
