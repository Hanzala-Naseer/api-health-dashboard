const bcrypt = require('bcryptjs');
const env = require('../config/env');

/** Hashes a plaintext password with bcrypt. Never store plaintext, ever. */
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
}

/** Compares a plaintext password against a bcrypt hash. */
async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

module.exports = { hashPassword, comparePassword };
