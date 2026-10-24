const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { requireAuth, requireFullAuth, allowRoles } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth, requireFullAuth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT r.id, r.title, r.category, r.details, r.status, r.created_at, u.username AS created_by FROM records r JOIN users u ON u.id = r.created_by ORDER BY r.created_at DESC LIMIT 500');
    res.json({ records: rows });
  } catch (error) { next(error); }
});
router.post('/', allowRoles('administrator', 'admin', 'manager', 'inputer'), async (req, res, next) => {
  try {
    const parsed = z.object({ title: z.string().trim().min(2).max(160), category: z.string().trim().min(2).max(80), details: z.string().trim().max(5000).default('') }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Title and category are required; details must be under 5000 characters.' });
    const { rows } = await query('INSERT INTO records (title, category, details, created_by) VALUES ($1, $2, $3, $4) RETURNING *', [parsed.data.title, parsed.data.category, parsed.data.details, req.user.sub]);
    await query('INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)', [req.user.sub, 'RECORD_CREATED', 'record', rows[0].id]);
    res.status(201).json({ record: rows[0] });
  } catch (error) { next(error); }
});
router.patch('/:id', allowRoles('administrator', 'admin', 'manager'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const parsed = z.object({ title: z.string().trim().min(2).max(160).optional(), category: z.string().trim().min(2).max(80).optional(), details: z.string().trim().max(5000).optional(), status: z.enum(['open','in_progress','closed']).optional() }).safeParse(req.body);
    if (!Number.isInteger(id) || id < 1 || !parsed.success || Object.keys(parsed.data).length === 0) return res.status(400).json({ error: 'Provide a valid id and at least one valid field.' });
    const { rows } = await query('UPDATE records SET title=COALESCE($1,title), category=COALESCE($2,category), details=COALESCE($3,details), status=COALESCE($4,status), updated_at=now() WHERE id=$5 RETURNING *', [parsed.data.title ?? null, parsed.data.category ?? null, parsed.data.details ?? null, parsed.data.status ?? null, id]);
    if (!rows[0]) return res.status(404).json({ error: 'Record not found.' });
    await query('INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)', [req.user.sub, 'RECORD_UPDATED', 'record', id]);
    res.json({ record: rows[0] });
  } catch (error) { next(error); }
});
router.delete('/:id', allowRoles('administrator', 'admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid record id.' });
    const { rows } = await query('DELETE FROM records WHERE id=$1 RETURNING id', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Record not found.' });
    await query('INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)', [req.user.sub, 'RECORD_DELETED', 'record', id]);
    res.json({ message: 'Record deleted.' });
  } catch (error) { next(error); }
});
module.exports = router;
