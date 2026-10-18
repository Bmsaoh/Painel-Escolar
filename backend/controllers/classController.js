const { getDB } = require('../config/database');
const { validationResult } = require('express-validator');

exports.getClasses = (req, res) => {
    const { page = 1, limit = 10, search = '', subject } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let query = `
        SELECT c.*, t.name as teacher_name 
        FROM classes c 
        LEFT JOIN teachers t ON c.teacher_id = t.id 
        WHERE 1=1
    `;
    const params = [];

    if (search) {
        query += ' AND (c.name LIKE ? OR c.code LIKE ? OR c.subject LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (subject) {
        query += ' AND c.subject LIKE ?';
        params.push(`%${subject}%`);
    }

    query += ' ORDER BY c.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar salas'
            });
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM classes c 
            WHERE 1=1
        `;
        const countParams = [];

        if (search) {
            countQuery += ' AND (c.name LIKE ? OR c.code LIKE ? OR c.subject LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (subject) {
            countQuery += ' AND c.subject LIKE ?';
            countParams.push(`%${subject}%`);
        }

        db.get(countQuery, countParams, (err2, countRow) => {
            if (err2) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao contar salas'
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

exports.getClassById = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.get(`
        SELECT c.*, t.name as teacher_name 
        FROM classes c 
        LEFT JOIN teachers t ON c.teacher_id = t.id 
        WHERE c.id = ?
    `, [id], (err, classItem) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro interno no servidor'
            });
        }

        if (!classItem) {
            return res.status(404).json({
                success: false,
                message: 'Sala não encontrada'
            });
        }

        res.json({
            success: true,
            data: { class: classItem }
        });
    });
};

exports.createClass = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }

    const { code, name, teacher_id, subject, room, schedule, capacity } = req.body;
    const db = getDB();

    db.run(
        'INSERT INTO classes (code, name, teacher_id, subject, room, schedule, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [code, name, teacher_id || null, subject, room, schedule, capacity || 35],
        function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao criar sala'
                });
            }

            db.get(`
                SELECT c.*, t.name as teacher_name 
                FROM classes c 
                LEFT JOIN teachers t ON c.teacher_id = t.id 
                WHERE c.id = ?
            `, [this.lastID], (err, classItem) => {
                res.status(201).json({
                    success: true,
                    message: 'Sala criada com sucesso',
                    data: { class: classItem }
                });
            });
        }
    );
};

exports.updateClass = (req, res) => {
    const { id } = req.params;
    const { code, name, teacher_id, subject, room, schedule, capacity } = req.body;
    const db = getDB();

    db.run(
        'UPDATE classes SET code = ?, name = ?, teacher_id = ?, subject = ?, room = ?, schedule = ?, capacity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [code, name, teacher_id || null, subject, room, schedule, capacity || 35, id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao atualizar sala'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Sala não encontrada'
                });
            }

            db.get(`
                SELECT c.*, t.name as teacher_name 
                FROM classes c 
                LEFT JOIN teachers t ON c.teacher_id = t.id 
                WHERE c.id = ?
            `, [id], (err, classItem) => {
                res.json({
                    success: true,
                    message: 'Sala atualizada com sucesso',
                    data: { class: classItem }
                });
            });
        }
    );
};

exports.deleteClass = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.run('DELETE FROM classes WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao excluir sala'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sala não encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Sala excluída com sucesso'
        });
    });
};

exports.getClassStudents = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.all(`
        SELECT s.* FROM students s
        LEFT JOIN classes c ON s.grade = c.name
        WHERE c.id = ? AND s.status = 'ativo'
        ORDER BY s.name
    `, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar estudantes da sala'
            });
        }

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    });
};
