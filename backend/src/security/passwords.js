const bcrypt = require('bcryptjs');

function pepperPassword(password) {
  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error('PASSWORD_PEPPER must be configured with a separate secret of at least 32 characters.');
  }
  return `${password}${pepper}`;
}

async function hashPassword(password) {
  return bcrypt.hash(pepperPassword(password), 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(pepperPassword(password), hash);
}

module.exports = { hashPassword, verifyPassword };
