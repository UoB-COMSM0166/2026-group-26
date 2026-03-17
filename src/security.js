const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function createToken(size = 32) {
  return crypto.randomBytes(size).toString('hex');
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createJwt(payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function verifyJwt(token, secret) {
  return jwt.verify(token, secret);
}

module.exports = {
  createToken,
  hashPassword,
  verifyPassword,
  createJwt,
  verifyJwt
};
