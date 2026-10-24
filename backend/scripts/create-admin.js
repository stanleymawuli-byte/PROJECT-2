require('dotenv').config();
const { query, pool } = require('../src/db');
const { hashPassword } = require('../src/security/passwords');
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

(async () => {
  const rl = readline.createInterface({ input, output });
  try {
    const username = (await rl.question('Administrator username: ')).trim();
    const email = (await rl.question('Administrator email: ')).trim().toLowerCase();
    const password = await rl.question('Strong password (12+ chars): ');
    if (!/^[a-zA-Z0-9_.-]{3,80}$/.test(username) || !email.includes('@') || password.length < 12) throw new Error('Invalid username/email or password too short.');
    const password_hash = await hashPassword(password);
    const result = await query("INSERT INTO users (username,email,password_hash,role) VALUES ($1,$2,$3,'admin') RETURNING id,username,email,role", [username,email,password_hash]);
    console.log('Admin created:', result.rows[0]);
    console.log('Now sign in locally, enroll MFA, and store the authenticator recovery details securely.');
  } catch (error) {
    console.error('Admin creation failed:', error.message);
    process.exitCode = 1;
  } finally { rl.close(); await pool.end(); }
})();
