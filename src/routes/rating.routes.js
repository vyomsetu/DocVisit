const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/rating.controller');

const router = Router();

router.post(
  '/',
  authenticate('patient'),
  [
    body('bookingId').isUUID(),
    body('stars').isInt({ min: 1, max: 5 }),
  ],
  validate,
  ctrl.rateDoctor
);

// Public — see a doctor's ratings
router.get('/doctor/:doctorId', ctrl.getDoctorRatings);

module.exports = router;
