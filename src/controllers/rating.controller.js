const pool = require('../config/db');

// POST /api/ratings
// body: { bookingId, stars }
// requires patient auth
async function rateDoctor(req, res, next) {
  try {
    const { bookingId, stars } = req.body;

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(422).json({ error: 'stars must be an integer between 1 and 5' });
    }

    // Booking must belong to this patient and be completed
    const { rows: bookingRows } = await pool.query(
      `SELECT doctor_id FROM bookings
       WHERE id = $1 AND patient_id = $2 AND status = 'completed'`,
      [bookingId, req.user.id]
    );

    if (!bookingRows.length) {
      return res.status(404).json({
        error: 'Booking not found, does not belong to you, or is not yet completed',
      });
    }

    const doctorId = bookingRows[0].doctor_id;

    // Prevent double-rating
    const { rows: existing } = await pool.query(
      'SELECT id FROM ratings WHERE booking_id = $1',
      [bookingId]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'This booking has already been rated' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO ratings (booking_id, patient_id, doctor_id, stars)
         VALUES ($1, $2, $3, $4)`,
        [bookingId, req.user.id, doctorId, stars]
      );

      // Recalculate doctor's average rating
      await client.query(
        `UPDATE doctors SET
           rating_count = rating_count + 1,
           avg_rating   = ((avg_rating * rating_count) + $1) / (rating_count + 1)
         WHERE id = $2`,
        [stars, doctorId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.status(201).json({ message: 'Rating submitted successfully' });
  } catch (err) {
    next(err);
  }
}

// GET /api/ratings/doctor/:doctorId
async function getDoctorRatings(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT r.stars, r.created_at, p.name AS patient_name
       FROM ratings r JOIN patients p ON r.patient_id = p.id
       WHERE r.doctor_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [req.params.doctorId]
    );
    res.json({ ratings: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { rateDoctor, getDoctorRatings };
