// routes/categories.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all categories
router.get('/categories', (req, res) => {
    db.query('SELECT * FROM categories', (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error retrieving categories' });
        }
        res.json(results);
    });
});

// Get single category
router.get('/categories/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM categories WHERE id = ?', [id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error retrieving category' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(results[0]);
    });
});

// Create new category
router.post('/categories', (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    const query = 'INSERT INTO categories (name, description) VALUES (?, ?)';
    db.query(query, [name, description], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error creating category' });
        }
        res.status(201).json({ id: results.insertId, name, description });
    });
});

// Update category
router.put('/categories/:id', (req, res) => {
    const id = req.params.id;       
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    const query = 'UPDATE categories SET name = ?, description = ? WHERE id = ?';
    db.query(query, [name, description, id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error updating category' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ id, name, description });
    });
});

// Delete category
router.delete('/categories/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM categories WHERE id = ?', [id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error deleting category' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    });
});

module.exports = router;