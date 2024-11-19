const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Đăng ký người dùng
router.post('/register', (req, res) => {
    const { username, email, password, fullname } = req.body;
    const sql = 'INSERT INTO users (username, email, password,fullname) VALUES (?, ?, ?,?)';
    db.query(sql, [username, email, password, fullname], (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ message: 'dang ky thanh cong !' });
    });
});

// Đăng nhập người dùng
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(401).json({ message: 'thong tin khong hop le ' });
        res.json({ message: 'Login successful', user: results[0] });
    });
}); 
// Cập nhật thông tin người dùng
router.put('/update', (req, res) => {
    const { id, name } = req.body;
    const sql = 'UPDATE users SET fullname = ? WHERE id = ?';
    db.query(sql, [name, id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'khong tim thay user' });
        res.json({ message: 'User information updated successfully!' });
    });
});
// Get all users
router.get('/users', (req, res) => {
    db.query('SELECT id, username, email, role, fullname FROM users WHERE role = 1', (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'loi truy xuat users' });
        }
        res.json(results);
    });
});
// Update user
        router.put('/users/:id', async (req, res) => {
            const { id } = req.params;
            const { email, password, fullname, role } = req.body;

            try {
                let query = 'UPDATE users SET email = ?, fullname = ?, role = ?';
                let params = [email, fullname, role];

                if (password) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    query += ', password = ?';
                    params.push(hashedPassword);
                }

                query += ' WHERE id = ?';
                params.push(id);

                const [result] = await db.promise().query(query, params);

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'User khong tim thay' });
                }

                res.json({ message: 'User updated successfully' });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'cap nhat  user' });
            }
        });

// Delete user
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Check if user is admin
        const [user] = await db.promise().query(
            'SELECT role FROM users WHERE id = ?',
            [id]
        );

        if (user[0]?.role === 2) {
            return res.status(403).json({ error: 'khong the xoa  admin user' });
        }

        const [result] = await db.promise().query(
            'DELETE FROM users WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User khong tim thay' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'xoa  user' });
    }
});
router.post('/password-change', (req, res) => {
    const { oldPassword, newPassword, confirmPassword, id } = req.body;

    const sql = 'SELECT password FROM users WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        console.log("Hii", result)
        if (err) return res.status(500).json(err);

        if (result.length === 0) {
            return res.status(404).json({ error: 'User khong tim thay' });  
        }

        const currentPassword = result[0].password;
        if (oldPassword !== currentPassword) {
            console.log("Hiii", oldPassword, currentPassword)
            return res.status(400).json({ error: 'Old password is incorrect' });
        }

        // New password and confirm password must match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New password and confirm password do not match' });
        }

        // Update the password in the database
        const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
        db.query(updateSql, [newPassword, id], (err, result) => {
            if (err) return res.status(500).json(err);
            res.status(200).json({ message: 'Password updated successfully' });
        });
    });
});
module.exports = router;
