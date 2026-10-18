const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');
const { auth } = require('../middleware/auth');

router.use(auth());

router.route('/')
    .get(studentController.getStudents)
    .post(
        [
            body('name').notEmpty().trim().escape().withMessage('Nome é obrigatório'),
            body('enrollment').notEmpty().withMessage('Matrícula é obrigatória'),
            body('email').isEmail().withMessage('Email inválido'),
            body('grade').optional().trim(),
            body('birth_date').optional().isISO8601(),
            body('status').optional().isIn(['ativo', 'inativo'])
        ],
        studentController.createStudent
    );

router.route('/:id')
    .get(studentController.getStudentById)
    .put(
        [
            body('name').notEmpty().trim().escape(),
            body('enrollment').notEmpty(),
            body('email').isEmail(),
            body('grade').optional().trim(),
            body('birth_date').optional().isISO8601(),
            body('status').optional().isIn(['ativo', 'inativo'])
        ],
        studentController.updateStudent
    )
    .delete(studentController.deleteStudent);

router.get('/:id/stats', studentController.getAttendanceStats);

module.exports = router;
