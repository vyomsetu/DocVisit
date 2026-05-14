const redis = require('../config/redis');

const DOCTOR_STATUS_KEY = (doctorId) => `doctor:status:${doctorId}`;

async function setDoctorStatus(doctorId, status) {
  await redis.set(DOCTOR_STATUS_KEY(doctorId), status);
}

async function getDoctorStatus(doctorId) {
  const status = await redis.get(DOCTOR_STATUS_KEY(doctorId));
  return status || 'offline';
}

async function getMultipleDoctorStatuses(doctorIds) {
  if (!doctorIds.length) return {};
  const keys = doctorIds.map(DOCTOR_STATUS_KEY);
  const values = await redis.mget(...keys);
  return Object.fromEntries(doctorIds.map((id, i) => [id, values[i] || 'offline']));
}

module.exports = { setDoctorStatus, getDoctorStatus, getMultipleDoctorStatuses };
