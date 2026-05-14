const jwt = require('../utils/jwt');

function authenticate(role) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    try {
      const payload = jwt.verifyAccess(header.slice(7));
      if (role && payload.role !== role) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Token expired or invalid' });
    }
  };
}

module.exports = { authenticate };
