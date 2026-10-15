const express = require('express');
const router = express.Router();
const StudentRecord = require('../models/StudentRecord');
const User = require('../models/User');

// Simple in-memory sample tables for query endpoint (kept small and read-only)
const sampleTables = {
  students: [
    { id: 1, name: 'Arjun', department: 'CSE', score: 88, email: 'arjun@student.com' },
    { id: 2, name: 'Meera', department: 'CSE', score: 91, email: 'meera@student.com' },
    { id: 3, name: 'Ravi', department: 'CSE', score: 84, email: 'ravi@student.com' },
  ],
  submissions: [
    { id: 101, student: 'Arjun', task: 'SQL Basics', status: 'Submitted' },
  ],
  lab_sessions: [
    { id: 201, topic: 'Database Design', duration: '45 min', instructor: 'Dr. Priya' },
  ],
};

// POST /api/lab/query  -- accepts a simple SQL-like text and returns matching rows
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    const text = String(query).trim().toLowerCase();
    let rows = [];

    if (text.includes('from submissions')) rows = sampleTables.submissions;
    else if (text.includes('from lab_sessions')) rows = sampleTables.lab_sessions;
    else rows = sampleTables.students;

    // simple LIMIT parsing
    const limitMatch = text.match(/limit\s+(\d+)/);
    if (limitMatch) {
      const n = parseInt(limitMatch[1], 10) || rows.length;
      rows = rows.slice(0, n);
    }

    return res.json({ rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Create or get student record by user email
router.get('/student/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let record = await StudentRecord.findOne({ user: user._id });
    if (!record) {
      record = await StudentRecord.create({ user: user._id });
    }
    res.json({ user, record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign a task to a student
router.post('/student/:email/task', async (req, res) => {
  try {
    const { title, due } = req.body;
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let record = await StudentRecord.findOne({ user: user._id });
    if (!record) record = await StudentRecord.create({ user: user._id });

    record.assignedTasks.push({ title, due });
    await record.save();
    res.json({ record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save viva notes
router.post('/student/:email/viva', async (req, res) => {
  try {
    const { notes } = req.body;
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let record = await StudentRecord.findOne({ user: user._id });
    if (!record) record = await StudentRecord.create({ user: user._id });

    record.vivaNotes = notes || '';
    await record.save();
    res.json({ record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save a report (text content) and return download link
router.post('/student/:email/report', async (req, res) => {
  try {
    const { filename, content } = req.body;
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let record = await StudentRecord.findOne({ user: user._id });
    if (!record) record = await StudentRecord.create({ user: user._id });

    record.reports.push({ filename, content });
    await record.save();

    res.json({ message: 'Report saved', reportId: record.reports[record.reports.length - 1]._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
