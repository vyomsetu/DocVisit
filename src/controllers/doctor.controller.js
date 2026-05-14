const pool = require('../config/db');
const redisService = require('../services/redis.service');

// GET /api/doctors?specialty=&page=&limit=
async function listActiveDoctors(req, res, next) {
  try {
    const { specialty, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `SELECT id, name, specialty, home_visit_price, call_price, avg_rating, rating_count
                 FROM doctors WHERE 1=1`;
    const params = [];

    if (specialty) {
      params.push(specialty);
      query += ` AND specialty = $${params.length}`;
    }

    query += ` ORDER BY avg_rating DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const { rows } = await pool.query(query, params);

    // Overlay real-time Redis status and filter to active only
    const statuses = await redisService.getMultipleDoctorStatuses(rows.map((d) => d.id));
    const active = rows
      .map((d) => ({ ...d, status: statuses[d.id] }))
      .filter((d) => d.status === 'active');

    res.json({ doctors: active, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// GET /api/doctors/:id
async function getDoctorProfile(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, specialty, home_visit_price, call_price, avg_rating, rating_count, created_at
       FROM doctors WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Doctor not found' });

    const doctor = rows[0];
    doctor.status = await redisService.getDoctorStatus(doctor.id);
    res.json(doctor);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/doctors/status
// body: { status: "active"|"offline" }
// requires doctor auth
async function toggleStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['active', 'offline'].includes(status)) {
      return res.status(422).json({ error: 'status must be "active" or "offline"' });
    }
    await redisService.setDoctorStatus(req.user.id, status);
    res.json({ message: `Status updated to ${status}` });
  } catch (err) {
    next(err);
  }
}

// PUT /api/doctors/profile
// body: { name, homeVisitPrice, callPrice }
// requires doctor auth
async function updateProfile(req, res, next) {
  try {
    const { name, homeVisitPrice, callPrice } = req.body;
    const { rows } = await pool.query(
      `UPDATE doctors SET name = COALESCE($1, name),
                          home_visit_price = COALESCE($2, home_visit_price),
                          call_price = COALESCE($3, call_price)
       WHERE id = $4
       RETURNING id, name, specialty, home_visit_price, call_price`,
      [name, homeVisitPrice, callPrice, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listActiveDoctors, getDoctorProfile, toggleStatus, updateProfile };
