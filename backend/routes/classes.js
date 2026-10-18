const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const classController = require('../controllers/classController');
const { auth } = require('../middleware/auth');

router.use(auth());

router.route('/')
    .get(classController.getClasses)
    .post(
        [
            body('code').notEmpty().withMessage('Código é obrigatório'),
            body('name').notEmpty().withMessage('Nome da sala é obrigatório'),
            body('teacher_id').optional().isInt(),
            body('subject').notEmpty(),
            body('room').notEmpty(),
            body('schedule').notEmpty(),
            body('capacity').optional().isInt({ min: 1 })
        ],
        classController.createClass
    );

router.route('/:id')
    .get(classController.getClassById)
    .put(
        [
            body('code').notEmpty(),
            body('name').notEmpty(),
            body('teacher_id').optional().isInt(),
            body('subject').notEmpty(),
            body('room').notEmpty(),
            body('schedule').notEmpty(),
            body('capacity').optional().isInt({ min: 1 })
        ],
        classController.updateClass
    )
    .delete(classController.deleteClass);

router.get('/:id/students', classController.getClassStudents);

module.exports = router;
