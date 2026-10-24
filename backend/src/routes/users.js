const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { requireAuth, requireFullAuth, allowRoles } = require('../middleware/auth');
const { hashPassword } = require('../security/passwords');

const router = express.Router();
router.use(requireAuth, requireFullAuth);

router.get('/', allowRoles('administrator', 'admin', 'manager'), async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, username, email, role, is_active, totp_enabled, created_at FROM users ORDER BY created_at DESC LIMIT 500');
    res.json({ users: rows });
  } catch (error) { next(error); }
});

router.post('/', allowRoles('administrator', 'manager'), async (req, res, next) => {
  try {
    const parsed = z.object({
      username: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9_.-]+$/),
      email: z.string().email().max(254),
      password: z.string().min(12).max(200),
      role: z.enum(['admin', 'manager', 'inputer', 'viewer']),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Check username, email, password (12+ characters), and role.' });
    if (req.user.role === 'manager' && parsed.data.role === 'admin') {
      return res.status(403).json({ error: 'Managers cannot create administrator accounts.' });
    }
    const password_hash = await hashPassword(parsed.data.password);
    const { rows } = await query(
      'INSERT INTO users (username, email, password_hash, role, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, is_active, created_at',
      [parsed.data.username, parsed.data.email.toLowerCase(), password_hash, parsed.data.role, req.user.sub]
    );
    await query('INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)', [req.user.sub, 'USER_CREATED', 'user', rows[0].id]);
    res.status(201).json({ user: rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Username or email already exists.' });
    next(error);
  }
});

router.patch('/:id/disable', allowRoles('administrator', 'admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid user id.' });
    if (id === Number(req.user.sub)) return res.status(400).json({ error: 'You cannot disable your own account.' });
    const { rows } = await query('UPDATE users SET is_active = false, updated_at = now() WHERE id = $1 RETURNING id, username, role, is_active', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
    await query('INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)', [req.user.sub, 'USER_DISABLED', 'user', id]);
    res.json({ user: rows[0] });
  } catch (error) { next(error); }
});

module.exports = router;
