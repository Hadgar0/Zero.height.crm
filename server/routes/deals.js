const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all deals
router.get('/', (req, res) => {
  const { stage, status, client_id } = req.query;
  let query = `
    SELECT d.*, c.name as client_name
    FROM deals d
    LEFT JOIN clients c ON d.client_id = c.id
  `;
  const params = [];
  const conditions = [];

  if (stage) { conditions.push('d.stage = ?'); params.push(stage); }
  if (status) { conditions.push('d.status = ?'); params.push(status); }
  if (client_id) { conditions.push('d.client_id = ?'); params.push(client_id); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY d.created_at DESC';

  res.json(db.prepare(query).all(...params));
});

// GET single deal
router.get('/:id', (req, res) => {
  const deal = db.prepare(`
    SELECT d.*, c.name as client_name
    FROM deals d LEFT JOIN clients c ON d.client_id = c.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!deal) return res.status(404).json({ error: 'Сделка не найдена' });
  deal.tasks = db.prepare('SELECT * FROM tasks WHERE deal_id = ?').all(req.params.id);
  res.json(deal);
});

// POST create deal
router.post('/', (req, res) => {
  const { client_id, title, amount = 0, stage = 'new', status = 'open', notes = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'Название обязательно' });

  const result = db.prepare(
    'INSERT INTO deals (client_id, title, amount, stage, status, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(client_id, title, amount, stage, status, notes);

  res.status(201).json(db.prepare(`
    SELECT d.*, c.name as client_name FROM deals d
    LEFT JOIN clients c ON d.client_id = c.id WHERE d.id = ?
  `).get(result.lastInsertRowid));
});

// PUT update deal
router.put('/:id', (req, res) => {
  const { client_id, title, amount, stage, status, notes } = req.body;
  const closed_at = status === 'closed' ? new Date().toISOString() : null;

  db.prepare(
    'UPDATE deals SET client_id=?, title=?, amount=?, stage=?, status=?, notes=?, closed_at=? WHERE id=?'
  ).run(client_id, title, amount, stage, status, notes, closed_at, req.params.id);

  res.json(db.prepare(`
    SELECT d.*, c.name as client_name FROM deals d
    LEFT JOIN clients c ON d.client_id = c.id WHERE d.id = ?
  `).get(req.params.id));
});

// DELETE deal
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE deal_id = ?').run(req.params.id);
  db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
