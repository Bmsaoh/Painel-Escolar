const { getDB } = require('../config/database');
const { validationResult } = require('express-validator');

exports.getAttendance = (req, res) => {
    const { date, class_id, student_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let query = `
        SELECT a.id, a.student_id, a.class_id, a.date, a.status, a.justification, a.created_at,
               s.name as student_name, s.enrollment, c.name as class_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        LEFT JOIN classes c ON a.class_id = c.id
        WHERE 1=1
    `;
    const params = [];

    if (date) {
        query += ' AND date(a.date) = date(?)';
        params.push(date);
    }

    if (class_id) {
        query += ' AND a.class_id = ?';
        params.push(class_id);
    }

    if (student_id) {
        query += ' AND a.student_id = ?';
        params.push(student_id);
    }

    query += ' ORDER BY a.date DESC, s.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar registros de presença'
            });
        }

        if (date || class_id) {
            return res.json({
                success: true,
                count: rows.length,
                data: rows
            });
        }

        const countQuery = 'SELECT COUNT(*) as total FROM attendance WHERE 1=1';
        let countConditions = '';
        const countParams = [];
        if (date) { countConditions += ' AND date(a.date) = date(?)'; countParams.push(date); }
        if (class_id) { countConditions += ' AND a.class_id = ?'; countParams.push(class_id); }
        if (student_id) { countConditions += ' AND a.student_id = ?'; countParams.push(student_id); }

        db.get(countQuery + countConditions, countParams, (err2, countRow) => {
            if (err2) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao contar registros'
                });
            }

            res.json({
                success: true,
                count: rows.length,
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

exports.recordAttendance = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }

    const { records, date } = req.body;
    const db = getDB();

    if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Nenhum registro de presença fornecido'
        });
    }

    db.serialize(() => {
        const stmt = db.prepare(
            'INSERT INTO attendance (student_id, class_id, date, status, justification) VALUES (?, ?, ?, ?, ?)'
        );

        records.forEach(record => {
            stmt.run(
                record.student_id,
                record.class_id || null,
                date,
                record.status,
                record.justification || null
            );
        });

        stmt.finalize((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao registrar presença'
                });
            }

            res.status(201).json({
                success: true,
                message: `${records.length} registros de presença salvos com sucesso`
            });
        });
    });
};

exports.updateAttendance = (req, res) => {
    const { id } = req.params;
    const { status, justification } = req.body;
    const db = getDB();

    db.run(
        'UPDATE attendance SET status = ?, justification = ? WHERE id = ?',
        [status, justification || null, id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao atualizar registro de presença'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Registro não encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Registro atualizado com sucesso'
            });
        }
    );
};

exports.getAttendanceStats = (req, res) => {
    const { class_id, start_date, end_date } = req.query;
    const db = getDB();

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
        dateFilter = 'WHERE date(a.date) BETWEEN date(?) AND date(?)';
        params.push(start_date, end_date);
    } else if (start_date) {
        dateFilter = 'WHERE date(a.date) >= date(?)';
        params.push(start_date);
    } else if (end_date) {
        dateFilter = 'WHERE date(a.date) <= date(?)';
        params.push(end_date);
    }

    if (class_id) {
        dateFilter += (dateFilter ? ' AND ' : 'WHERE ') + 'c.id = ?';
        params.push(class_id);
    }

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
        LEFT JOIN classes c ON a.class_id = c.id
        ${dateFilter}
        GROUP BY s.id, s.name, s.enrollment
        ORDER BY s.name
    `, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar estatísticas de presença'
            });
        }

        const stats = rows.map(r => ({
            student_name: r.student_name,
            enrollment: r.enrollment,
            present: r.present || 0,
            absent: r.absent || 0,
            late: r.late || 0,
            total: r.total || 0,
            attendance_rate: r.total > 0 ? ((r.present / r.total) * 100).toFixed(1) : '0.0'
        }));

        const totalPresent = stats.reduce((sum, s) => sum + s.present, 0);
        const totalRecords = stats.reduce((sum, s) => sum + s.total, 0);
        const overallRate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : '0.0';

        res.json({
            success: true,
            data: {
                stats,
                summary: {
                    overall_attendance: overallRate,
                    total_records: totalRecords,
                    total_present: totalPresent
                }
            }
        });
    });
};
