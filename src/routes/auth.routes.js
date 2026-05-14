const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/auth.controller');

const router = Router();

const ROLES = ['doctor', 'patient'];
const SPECIALTIES = ['general', 'diabetes', 'cardiology', 'paediatrics', 'orthopaedics'];

router.post(
  '/send-otp',
  [
    body('phone').isMobilePhone().withMessage('Valid phone number required'),
    body('role').isIn(ROLES).withMessage(`role must be one of: ${ROLES.join(', ')}`),
  ],
  validate,
  ctrl.sendOtp
);

router.post(
  '/verify-otp',
  [
    body('phone').isMobilePhone(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
    body('role').isIn(ROLES),
  ],
  validate,
  ctrl.verifyOtp
);

router.post(
  '/register/doctor',
  [
    body('name').notEmpty().trim(),
    body('specialty').isIn(SPECIALTIES).withMessage(`specialty must be one of: ${SPECIALTIES.join(', ')}`),
    body('homeVisitPrice').isFloat({ min: 0 }),
    body('callPrice').isFloat({ min: 0 }),
  ],
  validate,
  ctrl.registerDoctor
);

router.post(
  '/register/patient',
  [
    body('name').notEmpty().trim(),
    body('address').notEmpty().trim(),
  ],
  validate,
  ctrl.registerPatient
);

module.exports = router;
