const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const { validationResult } = require('express-validator');

const generateToken = (userId, email, role) => {
    return jwt.sign(
        { id: userId, email, role },
        process.env.JWT_SECRET || 'escola_manager_secret_key_2024',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

const generateAvatar = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }

    const { email, password } = req.body;
    const db = getDB();

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro interno no servidor'
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        const token = generateToken(user.id, user.email, user.role);

        db.run(
            'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, datetime("now", "+7 days"))',
            [user.id, token],
            (err) => {
                if (err) console.error('Erro ao salvar sessão:', err.message);
            }
        );

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    school_name: user.school_name
                }
            }
        });
    });
};

exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }

    const { name, email, password, role, school_name } = req.body;
    const db = getDB();

    const hashedPassword = await bcrypt.hash(password, 12);

    db.run(
        'INSERT INTO users (name, email, password, role, school_name) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, role || 'admin', school_name || 'Escola Manager'],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({
                        success: false,
                        message: 'Email já cadastrado'
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao criar usuário'
                });
            }

            const token = generateToken(this.lastID, email, role || 'admin');

            res.status(201).json({
                success: true,
                message: 'Usuário criado com sucesso',
                data: {
                    token,
                    user: {
                        id: this.lastID,
                        name,
                        email,
                        role: role || 'admin',
                        school_name: school_name || 'Escola Manager'
                    }
                }
            });
        }
    );
};

exports.getMe = (req, res) => {
    const db = getDB();

    db.get('SELECT id, name, email, role, school_name, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro interno no servidor'
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        res.json({
            success: true,
            data: { user }
        });
    });
};

exports.logout = (req, res) => {
    const db = getDB();
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        db.run('DELETE FROM sessions WHERE token = ?', [token]);
    }

    res.json({
        success: true,
        message: 'Logout realizado com sucesso'
    });
};

exports.verifyToken = (req, res) => {
    res.json({
        success: true,
        message: 'Token válido'
    });
};
