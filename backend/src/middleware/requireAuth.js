const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');

function requireAuth(req, res, next) {
    const authorization = req.get('authorization') || '';
    const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!bearerToken) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    try {
        req.admin = jwt.verify(bearerToken, jwtSecret);
        next();
    } catch (error) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
}

module.exports = requireAuth;