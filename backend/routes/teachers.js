const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const teacherController = require('../controllers/teacherController');
const { auth } = require('../middleware/auth');

router.use(auth());

router.route('/')
    .get(teacherController.getTeachers)
    .post(
        [
            body('name').notEmpty().trim().escape().withMessage('Nome é obrigatório'),
            body('employee_id').notEmpty().withMessage('ID do funcionário é obrigatório'),
            body('subject').optional().trim(),
            body('email').isEmail().withMessage('Email inválido'),
            body('status').optional().isIn(['ativo', 'inativo']),
            body('hire_date').optional().isISO8601()
        ],
        teacherController.createTeacher
    );

router.route('/:id')
    .get(teacherController.getTeacherById)
    .put(
        [
            body('name').notEmpty().trim().escape(),
            body('employee_id').notEmpty(),
            body('subject').optional().trim(),
            body('email').isEmail(),
            body('status').optional().isIn(['ativo', 'inativo']),
            body('hire_date').optional().isISO8601()
        ],
        teacherController.updateTeacher
    )
    .delete(teacherController.deleteTeacher);

module.exports = router;
