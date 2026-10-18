const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const gradeController = require('../controllers/gradeController');
const { auth } = require('../middleware/auth');

router.use(auth());

router.route('/')
    .get(gradeController.getGrades)
    .post(
        [
            body('student_id').isInt().withMessage('ID do estudante é obrigatório'),
            body('class_id').optional().isInt(),
            body('subject').notEmpty().withMessage('Disciplina é obrigatória'),
            body('bimester').notEmpty().withMessage('Bimestre é obrigatório'),
            body('grade_value').isFloat({ min: 0, max: 10 }).withMessage('Nota inválida'),
            body('max_value').optional().isFloat({ min: 0, max: 100 })
        ],
        gradeController.createGrade
    );

router.route('/:id')
    .put(
        [
            body('grade_value').isFloat({ min: 0, max: 10 }),
            body('max_value').optional().isFloat({ min: 0, max: 100 })
        ],
        gradeController.updateGrade
    )
    .delete(gradeController.deleteGrade);

router.get('/report', gradeController.getGradeReport);
router.get('/class/:class_id', gradeController.getClassGrades);

module.exports = router;
