const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

function auth(required = true) {
    return function (req, res, next) {
        if (!required) {
            return next();
        }

        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticação não fornecido'
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'escola_manager_secret_key_2024');
            req.user = decoded;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
    };
}

function authOptional() {
    return auth(false);
}

module.exports = { auth, authOptional };
