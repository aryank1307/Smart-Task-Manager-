const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { pool } = require('../db');

const router = express.Router();

router.use(authMiddleware);

const mapTask = (row) => ({
  _id: String(row.id),
  user: String(row.user_id),
  title: row.title,
  description: row.description || '',
  priority: row.priority,
  status: row.status,
  deadline: row.deadline ? new Date(row.deadline).toISOString() : null,
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, title, description, priority, status, deadline, created_at, updated_at
       FROM tasks
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows.map(mapTask));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const normalizedPriority = ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium';
    const normalizedDeadline = deadline || null;

    const [result] = await pool.execute(
      `INSERT INTO tasks (user_id, title, description, priority, status, deadline)
       VALUES (?, ?, ?, ?, 'Pending', ?)`,
      [req.user.id, title, description || '', normalizedPriority, normalizedDeadline]
    );

    const [rows] = await pool.execute(
      `SELECT id, user_id, title, description, priority, status, deadline, created_at, updated_at
       FROM tasks
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [result.insertId, req.user.id]
    );

    if (rows.length === 0) return res.status(500).json({ message: 'Failed to load created task' });
    res.status(201).json(mapTask(rows[0]));
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updates = [];
    const values = [];

    if (typeof req.body.title === 'string') {
      updates.push('title = ?');
      values.push(req.body.title);
    }
    if (typeof req.body.description === 'string') {
      updates.push('description = ?');
      values.push(req.body.description);
    }
    if (typeof req.body.priority === 'string' && ['Low', 'Medium', 'High'].includes(req.body.priority)) {
      updates.push('priority = ?');
      values.push(req.body.priority);
    }
    if (typeof req.body.status === 'string' && ['Pending', 'Completed'].includes(req.body.status)) {
      updates.push('status = ?');
      values.push(req.body.status);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'deadline')) {
      updates.push('deadline = ?');
      values.push(req.body.deadline || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    values.push(req.params.id, req.user.id);
    const [result] = await pool.execute(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Task not found' });

    const [rows] = await pool.execute(
      `SELECT id, user_id, title, description, priority, status, deadline, created_at, updated_at
       FROM tasks
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    res.json(mapTask(rows[0]));
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id
    ]);

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
});

module.exports = router;
