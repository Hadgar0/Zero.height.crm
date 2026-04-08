const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all clients
router.get('/', (req, res) => {
  const { search, status } = req.query;
  let query = 'SELECT * FROM clients';
  const params = [];
  const conditions = [];

  if (search) {
    conditions.push('(name LIKE ? OR email LIKE ? OR company LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';

  res.json(db.prepare(query).all(...params));
});

// GET single client with deals and interactions
router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Клиент не найден' });

  client.deals = db.prepare('SELECT * FROM deals WHERE client_id = ? ORDER BY created_at DESC').all(req.params.id);
  client.tasks = db.prepare('SELECT * FROM tasks WHERE client_id = ? ORDER BY due_date ASC').all(req.params.id);
  client.interactions = db.prepare('SELECT * FROM interactions WHERE client_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json(client);
});

// POST create client
router.post('/', (req, res) => {
  const { name, email, phone, company, status = 'active', notes = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя обязательно' });

  const result = db.prepare(
    'INSERT INTO clients (name, email, phone, company, status, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, email, phone, company, status, notes);

  res.status(201).json(db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid));
});

// PUT update client
router.put('/:id', (req, res) => {
  const { name, email, phone, company, status, notes } = req.body;
  db.prepare(
    'UPDATE clients SET name=?, email=?, phone=?, company=?, status=?, notes=? WHERE id=?'
  ).run(name, email, phone, company, status, notes, req.params.id);

  res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id));
});

// DELETE client
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM interactions WHERE client_id = ?').run(req.params.id);
  db.prepare('DELETE FROM tasks WHERE client_id = ?').run(req.params.id);
  db.prepare('DELETE FROM deals WHERE client_id = ?').run(req.params.id);
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST add interaction
router.post('/:id/interactions', (req, res) => {
  const { type = 'note', notes } = req.body;
  const result = db.prepare(
    'INSERT INTO interactions (client_id, type, notes) VALUES (?, ?, ?)'
  ).run(req.params.id, type, notes);

  res.status(201).json(db.prepare('SELECT * FROM interactions WHERE id = ?').get(result.lastInsertRowid));
});

module.exports = router;
