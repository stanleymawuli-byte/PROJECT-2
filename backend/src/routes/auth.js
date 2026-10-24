const express = require('express');
const { authenticator } = require('otplib');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { query } = require('../db');
const { verifyPassword } = require('../security/passwords');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const loginSchema = z.object({
  username: z.string().trim().min(3).max(80),
  password: z.string().min(1).max(200),
  totp: z.string().trim().regex(/^\d{6}$/).optional(),
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid username and password; include a six-digit authenticator code if enabled.' });
    const { username, password, totp } = parsed.data;
    const result = await query(
      'SELECT id, username, email, password_hash, role, is_active, totp_enabled, totp_secret FROM users WHERE lower(username) = lower($1) LIMIT 1',
      [username]
    );
    const user = result.rows[0];
    if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    if (!user.totp_enabled) {
      return res.status(403).json({ error: 'Multi-factor authentication must be enrolled before this account can sign in.', code: 'MFA_ENROLLMENT_REQUIRED' });
    }
    if (!totp || !authenticator.check(totp, user.totp_secret)) {
      return res.status(401).json({ error: 'A valid authenticator code is required.', code: 'MFA_REQUIRED' });
    }
    const token = jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '30m', issuer: 'project-two-api', audience: 'project-two-client' }
    );
    await query('INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)', [user.id, 'LOGIN_SUCCESS', 'user', user.id]);
    res.json({ token, expiresIn: 1800, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await query('SELECT id, username, email, role, is_active, totp_enabled, created_at FROM users WHERE id = $1', [req.user.sub]);
    if (!result.rows[0] || !result.rows[0].is_active) return res.status(401).json({ error: 'Account unavailable.' });
    res.json({ user: result.rows[0] });
  } catch (error) { next(error); }
});

router.post('/mfa/setup', requireAuth, async (req, res, next) => {
  try {
    const result = await query('SELECT id, username, totp_enabled FROM users WHERE id = $1', [req.user.sub]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.totp_enabled) return res.status(409).json({ error: 'MFA is already enabled. Ask an administrator to reset it.' });
    const secret = authenticator.generateSecret();
    await query('UPDATE users SET totp_secret = $1, updated_at = now() WHERE id = $2', [secret, user.id]);
    res.json({ secret, otpauthUrl: authenticator.keyuri(user.username, 'Project Two', secret), instructions: 'Add this account to an authenticator app, then confirm with POST /api/auth/mfa/verify.' });
  } catch (error) { next(error); }
});

router.post('/mfa/verify', requireAuth, async (req, res, next) => {
  try {
    const parsed = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'A six-digit authenticator code is required.' });
    const result = await query('SELECT totp_secret, totp_enabled FROM users WHERE id = $1', [req.user.sub]);
    const user = result.rows[0];
    if (!user || !user.totp_secret) return res.status(400).json({ error: 'Start MFA setup first.' });
    if (!authenticator.check(parsed.data.code, user.totp_secret)) return res.status(400).json({ error: 'Authenticator code is not valid.' });
    await query('UPDATE users SET totp_enabled = true, updated_at = now() WHERE id = $1', [req.user.sub]);
    await query('INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)', [req.user.sub, 'MFA_ENABLED', 'user', req.user.sub]);
    res.json({ message: 'Multi-factor authentication enabled. Sign in again with your authenticator code.' });
  } catch (error) { next(error); }
});

module.exports = router;
