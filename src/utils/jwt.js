const jwt = require('jsonwebtoken');

function signToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

module.exports = {
  signAccess(payload) {
    return signToken(payload, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '7d');
  },
  signTemp(payload) {
    return signToken(payload, process.env.JWT_TEMP_SECRET, process.env.JWT_TEMP_EXPIRES_IN || '10m');
  },
  verifyAccess(token) {
    return verifyToken(token, process.env.JWT_SECRET);
  },
  verifyTemp(token) {
    return verifyToken(token, process.env.JWT_TEMP_SECRET);
  },
};
