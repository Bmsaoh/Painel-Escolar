const { getDB } = require('../config/database');
const { validationResult } = require('express-validator');

exports.getStudents = (req, res) => {
    const { page = 1, limit = 10, search = '', status, grade } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (search) {
        query += ' AND (name LIKE ? OR enrollment LIKE ? OR email LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    if (grade) {
        query += ' AND grade LIKE ?';
        params.push(`%${grade}%`);
    }

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar estudantes'
            });
        }

        const countQuery = 'SELECT COUNT(*) as total FROM students WHERE 1=1';
        const countParams = [];

        if (search) {
            countQuery += ' AND (name LIKE ? OR enrollment LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (grade) {
            countQuery += ' AND grade LIKE ?';
            countParams.push(`%${grade}%`);
        }

        db.get(countQuery, countParams, (err2, countRow) => {
            if (err2) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao contar estudantes'
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

exports.getStudentById = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.get('SELECT * FROM students WHERE id = ?', [id], (err, student) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro interno no servidor'
            });
        }

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Estudante não encontrado'
            });
        }

        res.json({
            success: true,
            data: { student }
        });
    });
};

exports.createStudent = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }

    const { name, enrollment, email, grade, birth_date, status } = req.body;
    const db = getDB();

    const avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    db.run(
        'INSERT INTO students (name, enrollment, email, grade, birth_date, status, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, enrollment, email, grade, birth_date, status || 'ativo', avatar],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({
                        success: false,
                        message: 'Matrícula ou email já cadastrado'
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao criar estudante'
                });
            }

            db.get('SELECT * FROM students WHERE id = ?', [this.lastID], (err, student) => {
                res.status(201).json({
                    success: true,
                    message: 'Estudante criado com sucesso',
                    data: { student }
                });
            });
        }
    );
};

exports.updateStudent = (req, res) => {
    const { id } = req.params;
    const { name, enrollment, email, grade, birth_date, status } = req.body;
    const db = getDB();

    db.run(
        'UPDATE students SET name = ?, enrollment = ?, email = ?, grade = ?, birth_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, enrollment, email, grade, birth_date, status, id],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({
                        success: false,
                        message: 'Matrícula ou email já cadastrado'
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao atualizar estudante'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudante não encontrado'
                });
            }

            db.get('SELECT * FROM students WHERE id = ?', [id], (err, student) => {
                res.json({
                    success: true,
                    message: 'Estudante atualizado com sucesso',
                    data: { student }
                });
            });
        }
    );
};

exports.deleteStudent = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.run('DELETE FROM students WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao excluir estudante'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Estudante não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Estudante excluído com sucesso'
        });
    });
};

exports.getAttendanceStats = (req, res) => {
    const db = getDB();

    db.all(`
        SELECT 
            s.name as student_name,
            s.enrollment,
            COUNT(CASE WHEN a.status = 'presente' THEN 1 END) as present,
            COUNT(CASE WHEN a.status = 'ausente' THEN 1 END) as absent,
            COUNT(CASE WHEN a.status = 'atrasado' THEN 1 END) as late,
            COUNT(a.id) as total
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
        WHERE s.status = 'ativo'
        GROUP BY s.id
        ORDER BY s.name
        LIMIT 10
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar estatísticas'
            });
        }

        const stats = rows.map(r => ({
            student_name: r.student_name,
            enrollment: r.enrollment,
            attendance_rate: r.total > 0 ? ((r.present / r.total) * 100).toFixed(1) : '0.0'
        }));

        res.json({
            success: true,
            data: stats
        });
    });
};
