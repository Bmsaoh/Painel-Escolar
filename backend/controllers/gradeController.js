const { getDB } = require('../config/database');
const { validationResult } = require('express-validator');

exports.getGrades = (req, res) => {
    const { student_id, class_id, subject, bimester, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let query = `
        SELECT g.id, g.student_id, g.class_id, g.subject, g.bimester, g.grade_value, g.max_value, g.created_at,
               s.name as student_name, s.enrollment
        FROM grades g
        JOIN students s ON g.student_id = s.id
        WHERE 1=1
    `;
    const params = [];

    if (student_id) {
        query += ' AND g.student_id = ?';
        params.push(student_id);
    }
    if (class_id) {
        query += ' AND g.class_id = ?';
        params.push(class_id);
    }
    if (subject) {
        query += ' AND g.subject LIKE ?';
        params.push(`%${subject}%`);
    }
    if (bimester) {
        query += ' AND g.bimester = ?';
        params.push(bimester);
    }

    query += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar notas'
            });
        }

        res.json({
            success: true,
            count: rows.length,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
            }
        });
    });
};

exports.getClassGrades = (req, res) => {
    const { class_id, bimester } = req.query;
    const db = getDB();

    if (!class_id) {
        return res.status(400).json({
            success: false,
            message: 'ID da sala é obrigatório'
        });
    }

    let query = `
        SELECT 
            s.id as student_id,
            s.name as student_name,
            s.enrollment,
            g.bimester,
            g.grade_value,
            g.id as grade_id
        FROM students s
        LEFT JOIN grades g ON s.id = g.student_id 
            AND g.class_id = ? 
            AND (g.bimester = ? OR ? IS NULL)
        WHERE s.grade = (SELECT name FROM classes WHERE id = ?)
        ORDER BY s.name
    `;
    const params = [class_id, bimester || null, bimester || null, class_id];

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar notas da sala'
            });
        }

        const studentsMap = new Map();

        rows.forEach(row => {
            if (!studentsMap.has(row.student_id)) {
                studentsMap.set(row.student_id, {
                    student_id: row.student_id,
                    student_name: row.student_name,
                    enrollment: row.enrollment,
                    grades: {}
                });
            }
            if (row.grade_value !== null && row.bimester) {
                studentsMap.get(row.student_id).grades[row.bimester] = row.grade_value;
            }
        });

        const result = Array.from(studentsMap.values());

        result.forEach(student => {
            const gradeValues = Object.values(student.grades);
            if (gradeValues.length > 0) {
                const avg = gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length;
                student.average = Number(avg.toFixed(2));
                if (avg >= 6.0) {
                    student.status = 'aprovado';
                } else if (avg >= 4.0) {
                    student.status = 'recuperacao';
                } else {
                    student.status = 'reprovado';
                }
            } else {
                student.average = null;
                student.status = null;
            }
        });

        res.json({
            success: true,
            data: result
        });
    });
};

exports.createGrade = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }

    const { student_id, class_id, subject, bimester, grade_value, max_value } = req.body;
    const db = getDB();

    db.get(
        'SELECT id FROM grades WHERE student_id = ? AND class_id = ? AND subject = ? AND bimester = ?',
        [student_id, class_id, subject, bimester],
        (err, existing) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao verificar nota existente'
                });
            }

            if (existing) {
                db.run(
                    'UPDATE grades SET grade_value = ?, max_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [grade_value, max_value || 10, existing.id],
                    function(err) {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: 'Erro ao atualizar nota'
                            });
                        }
                        return res.json({
                            success: true,
                            message: 'Nota atualizada com sucesso'
                        });
                    }
                );
            } else {
                db.run(
                    'INSERT INTO grades (student_id, class_id, subject, bimester, grade_value, max_value) VALUES (?, ?, ?, ?, ?, ?)',
                    [student_id, class_id, subject, bimester, grade_value, max_value || 10],
                    function(err) {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: 'Erro ao criar nota'
                            });
                        }
                        res.status(201).json({
                            success: true,
                            message: 'Nota registrada com sucesso'
                        });
                    }
                );
            }
        }
    );
};

exports.updateGrade = (req, res) => {
    const { id } = req.params;
    const { grade_value, max_value } = req.body;
    const db = getDB();

    db.run(
        'UPDATE grades SET grade_value = ?, max_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [grade_value, max_value || 10, id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao atualizar nota'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Nota não encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Nota atualizada com sucesso'
            });
        }
    );
};

exports.deleteGrade = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.run('DELETE FROM grades WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao excluir nota'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nota não encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Nota excluída com sucesso'
        });
    });
};

exports.getGradeReport = (req, res) => {
    const { class_id, bimester } = req.query;
    const db = getDB();

    let query = `
        SELECT 
            c.name as class_name,
            c.subject,
            t.name as teacher_name,
            s.name as student_name,
            s.enrollment,
            g.bimester,
            g.grade_value,
            g.max_value,
            (g.grade_value / g.max_value * 10) as percentage
        FROM grades g
        JOIN students s ON g.student_id = s.id
        JOIN classes c ON g.class_id = c.id
        LEFT JOIN teachers t ON c.teacher_id = t.id
        WHERE 1=1
    `;
    const params = [];

    if (class_id) {
        query += ' AND g.class_id = ?';
        params.push(class_id);
    }
    if (bimester) {
        query += ' AND g.bimester = ?';
        params.push(bimester);
    }

    query += ' ORDER BY c.name, s.name, g.bimester';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao gerar relatório de notas'
            });
        }

        const report = rows.reduce((acc, row) => {
            const classKey = `${row.class_name}-${row.subject}`;
            if (!acc[classKey]) {
                acc[classKey] = {
                    class_name: row.class_name,
                    subject: row.subject,
                    teacher_name: row.teacher_name,
                    students: []
                };
            }
            const student = acc[classKey].students.find(s => s.enrollment === row.enrollment);
            if (student) {
                student.grades.push({
                    bimester: row.bimester,
                    value: row.grade_value,
                    max: row.max_value,
                    percentage: row.percentage
                });
            } else {
                acc[classKey].students.push({
                    name: row.student_name,
                    enrollment: row.enrollment,
                    grades: [{
                        bimester: row.bimester,
                        value: row.grade_value,
                        max: row.max_value,
                        percentage: row.percentage
                    }]
                });
            }
            return acc;
        }, {});

        const reportArray = Object.values(report);
        reportArray.forEach(classItem => {
            classItem.students.forEach(student => {
                const values = student.grades.map(g => g.value);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                student.average = Number(avg.toFixed(2));
                student.percentage = Number((avg / 10 * 100).toFixed(1));
                if (student.percentage >= 60) {
                    student.status = 'aprovado';
                } else if (student.percentage >= 40) {
                    student.status = 'recuperacao';
                } else {
                    student.status = 'reprovado';
                }
            });
        });

        res.json({
            success: true,
            data: reportArray
        });
    });
};
