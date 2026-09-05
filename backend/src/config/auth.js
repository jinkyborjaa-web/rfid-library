const crypto = require('crypto');

const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

module.exports = { jwtSecret };
