const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const { auth } = require('../middleware/auth');

router.use(auth());

router.route('/')
    .get(attendanceController.getAttendance)
    .post(
        [
            body('records').isArray({ min: 1 }).withMessage('Registros são obrigatórios'),
            body('date').notEmpty().withMessage('Data é obrigatória')
        ],
        attendanceController.recordAttendance
    );

router.route('/:id')
    .put(
        [
            body('status').isIn(['presente', 'ausente', 'atrasado']).withMessage('Status inválido'),
            body('justification').optional().trim()
        ],
        attendanceController.updateAttendance
    );

router.get('/stats/summary', attendanceController.getAttendanceStats);

module.exports = router;
