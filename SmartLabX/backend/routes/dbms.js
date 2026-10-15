const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to a local SQLite database file
const dbPath = path.resolve(__dirname, '../dbms_lab.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database for DBMS Lab.');
    }
});

// Endpoint to execute SQL queries
router.post('/execute', (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'SQL query is required' });
    }

    const trimmedQuery = query.trim();
    const upperQuery = trimmedQuery.toUpperCase();
    const isSelect = upperQuery.startsWith('SELECT') || upperQuery.startsWith('PRAGMA') || upperQuery.startsWith('WITH');

    if (isSelect) {
        // Use db.all to return rows
        db.all(trimmedQuery, [], (err, rows) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ message: 'Query executed successfully', data: rows });
        });
    } else {
        // Use db.run for INSERT, UPDATE, DELETE, CREATE, etc.
        db.run(trimmedQuery, [], function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({
                message: 'Statement executed successfully',
                changes: this.changes,
                lastID: this.lastID
            });
        });
    }
});

module.exports = router;
