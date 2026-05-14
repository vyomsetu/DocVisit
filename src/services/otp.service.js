const redis = require('../config/redis');
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const OTP_TTL = Number(process.env.OTP_TTL_SECONDS) || 300;
const OTP_KEY = (phone, role) => `otp:${role}:${phone}`;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtp(phone, role) {
  const otp = generateOtp();
  // @upstash/redis uses { ex: seconds } instead of ioredis 'EX', seconds
  await redis.set(OTP_KEY(phone, role), otp, { ex: OTP_TTL });

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for ${phone} (${role}): ${otp}`);
    return;
  }

  await client.messages.create({
    body: `Your DocVisit OTP is ${otp}. Valid for ${OTP_TTL / 60} minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
}

async function verifyOtp(phone, role, submittedOtp) {
  const stored = await redis.get(OTP_KEY(phone, role));
  if (!stored || stored !== submittedOtp) return false;
  await redis.del(OTP_KEY(phone, role));
  return true;
}

module.exports = { sendOtp, verifyOtp };
