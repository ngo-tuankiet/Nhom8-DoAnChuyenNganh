// routes/brands.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
// Get all brands
router.get('/list', (req, res) => {
    db.query('SELECT * FROM brands', (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error retrieving brands' });
        }
        res.json(results);
    });
});

// Create new brand
router.post('/brands', (req, res) => {
    const { brand_name } = req.body;

    if (!brand_name) {
        return res.status(400).json({ error: 'Brand name is required' });
    }

    const query = 'INSERT INTO brands (brand_name) VALUES (?)';
    db.query(query, [brand_name], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error creating brand' });
        }
        res.status(201).json({ message: 'Brand created successfully', id: results.insertId });
    });
});

// Update brand
router.put('/brands/:id', (req, res) => {
    const { id } = req.params;
    const { brand_name } = req.body;

    if (!brand_name) {
        return res.status(400).json({ error: 'Brand name is required' });
    }

    const query = 'UPDATE brands SET brand_name = ? WHERE id = ?';
    db.query(query, [brand_name, id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error updating brand' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Brand not found' });
        }
        res.json({ message: 'Brand updated successfully' });
    });
});

// Delete brand
router.delete('/brands/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM brands WHERE id = ?';
    db.query(query, [id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error deleting brand' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Brand not found' });
        }
        res.json({ message: 'Brand deleted successfully' });
    });
});

module.exports = router;