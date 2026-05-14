const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/booking.controller');

const router = Router();

router.post(
  '/',
  authenticate('patient'),
  [
    body('doctorId').isUUID(),
    body('bookingType').isIn(['home_visit', 'call']),
    body('scheduledAt').isISO8601(),
    body('patientAddress').optional().notEmpty().trim(),
  ],
  validate,
  ctrl.createBooking
);

// Both patients and doctors can list their own bookings
router.get('/', authenticate(), ctrl.listBookings);

router.patch(
  '/:id/status',
  authenticate('doctor'),
  [body('status').isIn(['confirmed', 'completed', 'cancelled'])],
  validate,
  ctrl.updateBookingStatus
);

module.exports = router;
