const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all tasks
router.get('/', (req, res) => {
  const { status, priority, client_id } = req.query;
  let query = `
    SELECT t.*, c.name as client_name, d.title as deal_title
    FROM tasks t
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN deals d ON t.deal_id = d.id
  `;
  const params = [];
  const conditions = [];

  if (status) { conditions.push('t.status = ?'); params.push(status); }
  if (priority) { conditions.push('t.priority = ?'); params.push(priority); }
  if (client_id) { conditions.push('t.client_id = ?'); params.push(client_id); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY t.due_date ASC';

  res.json(db.prepare(query).all(...params));
});

// GET single task
router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, c.name as client_name, d.title as deal_title
    FROM tasks t
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN deals d ON t.deal_id = d.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) return res.status(404).json({ error: 'Задача не найдена' });
  res.json(task);
});

// POST create task
router.post('/', (req, res) => {
  const { client_id, deal_id, title, description = '', status = 'pending', priority = 'medium', due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Название обязательно' });

  const result = db.prepare(
    'INSERT INTO tasks (client_id, deal_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(client_id || null, deal_id || null, title, description, status, priority, due_date || null);

  res.status(201).json(db.prepare(`
    SELECT t.*, c.name as client_name, d.title as deal_title
    FROM tasks t LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN deals d ON t.deal_id = d.id WHERE t.id = ?
  `).get(result.lastInsertRowid));
});

// PUT update task
router.put('/:id', (req, res) => {
  const { client_id, deal_id, title, description, status, priority, due_date } = req.body;
  db.prepare(
    'UPDATE tasks SET client_id=?, deal_id=?, title=?, description=?, status=?, priority=?, due_date=? WHERE id=?'
  ).run(client_id || null, deal_id || null, title, description, status, priority, due_date || null, req.params.id);

  res.json(db.prepare(`
    SELECT t.*, c.name as client_name, d.title as deal_title
    FROM tasks t LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN deals d ON t.deal_id = d.id WHERE t.id = ?
  `).get(req.params.id));
});

// DELETE task
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
