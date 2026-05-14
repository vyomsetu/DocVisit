const pool = require('../config/db');
const otpService = require('../services/otp.service');
const jwt = require('../utils/jwt');

// POST /api/auth/send-otp
// body: { phone, role: "doctor"|"patient" }
async function sendOtp(req, res, next) {
  try {
    const { phone, role } = req.body;
    await otpService.sendOtp(phone, role);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-otp
// body: { phone, otp, role }
// Returns: access token if user exists, temp token if new user
async function verifyOtp(req, res, next) {
  try {
    const { phone, otp, role } = req.body;

    const valid = await otpService.verifyOtp(phone, role, otp);
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const table = role === 'doctor' ? 'doctors' : 'patients';
    const { rows } = await pool.query(`SELECT id FROM ${table} WHERE phone = $1`, [phone]);

    if (rows.length > 0) {
      // Existing user — issue full access token
      const token = jwt.signAccess({ id: rows[0].id, role, phone });
      return res.json({ token, requiresRegistration: false });
    }

    // New user — issue short-lived temp token; client must call /register
    const tempToken = jwt.signTemp({ phone, role });
    res.json({ tempToken, requiresRegistration: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/register/doctor
// header: Authorization: Bearer <tempToken>
// body: { name, specialty, homeVisitPrice, callPrice }
async function registerDoctor(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing temp token' });
    }

    let payload;
    try {
      payload = jwt.verifyTemp(header.slice(7));
    } catch {
      return res.status(401).json({ error: 'Temp token expired or invalid' });
    }

    if (payload.role !== 'doctor') return res.status(403).json({ error: 'Forbidden' });

    const { name, specialty, homeVisitPrice, callPrice } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO doctors (name, phone, specialty, home_visit_price, call_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, payload.phone, specialty, homeVisitPrice, callPrice]
    );

    const token = jwt.signAccess({ id: rows[0].id, role: 'doctor', phone: payload.phone });
    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/register/patient
// header: Authorization: Bearer <tempToken>
// body: { name, address }
async function registerPatient(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing temp token' });
    }

    let payload;
    try {
      payload = jwt.verifyTemp(header.slice(7));
    } catch {
      return res.status(401).json({ error: 'Temp token expired or invalid' });
    }

    if (payload.role !== 'patient') return res.status(403).json({ error: 'Forbidden' });

    const { name, address } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO patients (name, phone, address)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, payload.phone, address]
    );

    const token = jwt.signAccess({ id: rows[0].id, role: 'patient', phone: payload.phone });
    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendOtp, verifyOtp, registerDoctor, registerPatient };
