const { Router } = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/doctor.controller');

const SPECIALTIES = ['general', 'diabetes', 'cardiology', 'paediatrics', 'orthopaedics'];

const router = Router();

// Public — browse active doctors
router.get(
  '/',
  [query('specialty').optional().isIn(SPECIALTIES)],
  validate,
  ctrl.listActiveDoctors
);

// Public — individual doctor profile
router.get('/:id', ctrl.getDoctorProfile);

// Doctor-only routes
router.patch(
  '/status',
  authenticate('doctor'),
  [body('status').isIn(['active', 'offline'])],
  validate,
  ctrl.toggleStatus
);

router.put(
  '/profile',
  authenticate('doctor'),
  [
    body('name').optional().notEmpty().trim(),
    body('homeVisitPrice').optional().isFloat({ min: 0 }),
    body('callPrice').optional().isFloat({ min: 0 }),
  ],
  validate,
  ctrl.updateProfile
);

module.exports = router;
