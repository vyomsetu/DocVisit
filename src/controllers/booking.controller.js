const pool = require('../config/db');
const redisService = require('../services/redis.service');

// POST /api/bookings
// body: { doctorId, bookingType: "home_visit"|"call", scheduledAt, patientAddress? }
// requires patient auth
async function createBooking(req, res, next) {
  try {
    const { doctorId, bookingType, scheduledAt, patientAddress } = req.body;

    // Verify doctor exists
    const { rows: doctorRows } = await pool.query('SELECT id FROM doctors WHERE id = $1', [doctorId]);
    if (!doctorRows.length) return res.status(404).json({ error: 'Doctor not found' });

    // Check doctor is active in Redis
    const status = await redisService.getDoctorStatus(doctorId);
    if (status !== 'active') {
      return res.status(409).json({ error: 'Doctor is currently offline' });
    }

    if (bookingType === 'home_visit' && !patientAddress) {
      return res.status(422).json({ error: 'patientAddress is required for home_visit bookings' });
    }

    const { rows } = await pool.query(
      `INSERT INTO bookings (patient_id, doctor_id, booking_type, status, scheduled_at, patient_address)
       VALUES ($1, $2, $3, 'pending', $4, $5)
       RETURNING *`,
      [req.user.id, doctorId, bookingType, scheduledAt, patientAddress || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings
// Patient sees their bookings; doctor sees bookings assigned to them
async function listBookings(req, res, next) {
  try {
    const { role, id } = req.user;
    const { status } = req.query;

    let query, params;

    if (role === 'patient') {
      query = `SELECT b.*, d.name AS doctor_name, d.specialty, d.phone AS doctor_phone
               FROM bookings b JOIN doctors d ON b.doctor_id = d.id
               WHERE b.patient_id = $1`;
      params = [id];
    } else {
      query = `SELECT b.*, p.name AS patient_name, p.phone AS patient_phone, p.address AS patient_registered_address
               FROM bookings b JOIN patients p ON b.patient_id = p.id
               WHERE b.doctor_id = $1`;
      params = [id];
    }

    if (status) {
      params.push(status);
      query += ` AND b.status = $${params.length}`;
    }

    query += ` ORDER BY b.scheduled_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json({ bookings: rows });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/bookings/:id/status
// body: { status: "confirmed"|"completed"|"cancelled" }
// requires doctor auth
async function updateBookingStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(422).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }

    const { rows } = await pool.query(
      `UPDATE bookings SET status = $1
       WHERE id = $2 AND doctor_id = $3
       RETURNING *`,
      [status, req.params.id, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { createBooking, listBookings, updateBookingStatus };
