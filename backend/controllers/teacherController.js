const { getDB } = require('../config/database');
const { validationResult } = require('express-validator');

exports.getTeachers = (req, res) => {
    const { page = 1, limit = 10, search = '', status, subject } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let query = 'SELECT * FROM teachers WHERE 1=1';
    const params = [];

    if (search) {
        query += ' AND (name LIKE ? OR employee_id LIKE ? OR email LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    if (subject) {
        query += ' AND subject LIKE ?';
        params.push(`%${subject}%`);
    }

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar professores'
            });
        }

        const countQuery = 'SELECT COUNT(*) as total FROM teachers WHERE 1=1';
        const countParams = [];

        if (search) {
            countQuery += ' AND (name LIKE ? OR employee_id LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (subject) {
            countQuery += ' AND subject LIKE ?';
            countParams.push(`%${subject}%`);
        }

        db.get(countQuery, countParams, (err2, countRow) => {
            if (err2) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao contar professores'
                });
            }

            res.json({
                success: true,
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countRow.total,
                    pages: Math.ceil(countRow.total / limit)
                }
            });
        });
    });
};

exports.getTeacherById = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.get('SELECT * FROM teachers WHERE id = ?', [id], (err, teacher) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro interno no servidor'
            });
        }

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Professor não encontrado'
            });
        }

        res.json({
            success: true,
            data: { teacher }
        });
    });
};

exports.createTeacher = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }

    const { name, employee_id, subject, email, status, hire_date } = req.body;
    const db = getDB();

    const avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    db.run(
        'INSERT INTO teachers (name, employee_id, subject, email, status, hire_date, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, employee_id, subject, email, status || 'ativo', hire_date, avatar],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({
                        success: false,
                        message: 'ID de funcionário já cadastrado'
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao criar professor'
                });
            }

            db.get('SELECT * FROM teachers WHERE id = ?', [this.lastID], (err, teacher) => {
                res.status(201).json({
                    success: true,
                    message: 'Professor criado com sucesso',
                    data: { teacher }
                });
            });
        }
    );
};

exports.updateTeacher = (req, res) => {
    const { id } = req.params;
    const { name, employee_id, subject, email, status, hire_date } = req.body;
    const db = getDB();

    db.run(
        'UPDATE teachers SET name = ?, employee_id = ?, subject = ?, email = ?, status = ?, hire_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, employee_id, subject, email, status, hire_date, id],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({
                        success: false,
                        message: 'ID de funcionário já cadastrado'
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao atualizar professor'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Professor não encontrado'
                });
            }

            db.get('SELECT * FROM teachers WHERE id = ?', [id], (err, teacher) => {
                res.json({
                    success: true,
                    message: 'Professor atualizado com sucesso',
                    data: { teacher }
                });
            });
        }
    );
};

exports.deleteTeacher = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.run('DELETE FROM teachers WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao excluir professor'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Professor não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Professor excluído com sucesso'
        });
    });
};
