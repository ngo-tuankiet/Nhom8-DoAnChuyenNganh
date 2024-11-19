const express = require ('express');
const multer = require('multer');
const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const router = express.Router;
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/'); // Thư mục lưu ảnh
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname)); // Tạo tên file duy nhất
        }
    })
});

// Tạo sản phẩm mới và lưu nhiều ảnh vào thư mục cục bộ
router.post('/create', upload.array('images', 10), (req, res) => {
    const { name, description, price, stock, brand_id, subcategory_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    // Kiểm tra brand_id và subcategory_id có tồn tại
    const checkForeignKeys = `
        SELECT 
            (SELECT COUNT(*) FROM brands WHERE id = ?) as brandExists,
            (SELECT COUNT(*) FROM categories WHERE id = ?) as categoryExists
    `;

    db.query(checkForeignKeys, [brand_id, subcategory_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!results[0].brandExists) {
            return res.status(400).json({ error: 'Invalid brand_id' });
        }

        if (!results[0].categoryExists) {
            return res.status(400).json({ error: 'Invalid subcategory_id' });
        }

        // Thêm sản phẩm vào bảng products
        const sqlProduct = `
            INSERT INTO products 
            (name, description, price, stock, brand_id, subcategory_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(sqlProduct, [name, description, price, stock, brand_id, subcategory_id], (err, result) => {
            if (err) {
                console.error('Error inserting product:', err);
                return res.status(500).json({ error: 'Error inserting product' });
            }

            const productId = result.insertId;

            // Lưu đường dẫn ảnh vào bảng productImage
            const sqlImage = `INSERT INTO productImage (product_id, url) VALUES (?, ?)`;
            const uploadPromises = files.map(file => {
                const imageUrl = `/uploads/${file.filename}`;
                return db.promise().query(sqlImage, [productId, imageUrl]);
            });

            Promise.all(uploadPromises)
                .then(() => {
                    res.status(201).json({
                        message: 'Product created successfully',
                        productId,
                        images: files.map(file => `/uploads/${file.filename}`)
                    });
                })
                .catch(error => {
                    console.error('Error inserting image URL:', error);
                    res.status(500).json({ error: 'Error inserting image URL' });
                });
        });
    });
});

// Cập nhật sản phẩm và thay thế ảnh
router.put('/update/:id', upload.array('images', 10), async (req, res) => {
    const productId = req.params.id;
    const { name, description, price, stock, brand_id, subcategory_id } = req.body;
    const files = req.files;

    // Kiểm tra brand_id và subcategory_id có tồn tại
    const checkForeignKeys = `
        SELECT 
            (SELECT COUNT(*) FROM brands WHERE id = ?) as brandExists,
            (SELECT COUNT(*) FROM categories WHERE id = ?) as categoryExists
    `;

    const [foreignKeyResults] = await db.promise().query(checkForeignKeys, [brand_id, subcategory_id]);

    if (!foreignKeyResults[0].brandExists) {
        return res.status(400).json({ error: 'Invalid brand_id' });
    }

    if (!foreignKeyResults[0].categoryExists) {
        return res.status(400).json({ error: 'Invalid subcategory_id' });
    }

    // Cập nhật thông tin sản phẩm
    const sqlUpdateProduct = `
        UPDATE products 
        SET name = ?, description = ?, price = ?, stock = ?, brand_id = ?, subcategory_id = ?
        WHERE id = ?
    `;
    await db.promise().query(sqlUpdateProduct, [name, description, price, stock, brand_id, subcategory_id, productId]);

    // Nếu có files mới, upload và cập nhật
    if (files && files.length > 0) {
        // Lấy danh sách ảnh cũ để xóa khỏi thư mục
        const oldImages = await db.promise().query('SELECT url FROM productImage WHERE product_id = ?', [productId]);
        oldImages[0].forEach(img => {
            const filePath = path.join(__dirname, '../', img.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); // Xóa ảnh cũ khỏi thư mục
            }
        });

        // Xóa bản ghi ảnh cũ từ bảng productImage
        await db.promise().query('DELETE FROM productImage WHERE product_id = ?', [productId]);

        // Lưu ảnh mới vào thư mục và cập nhật bản ghi ảnh mới
        const sqlImage = `INSERT INTO productImage (product_id, url) VALUES (?, ?)`;
        const uploadPromises = files.map(file => {
            const imageUrl = `/uploads/${file.filename}`;
            return db.promise().query(sqlImage, [productId, imageUrl]);
        });

        const imageUrls = await Promise.all(uploadPromises);

        res.json({
            message: 'Product updated successfully',
            productId,
            images: imageUrls
        });
    } else {
        res.json({ message: 'Product updated successfully' });
    }
});

// Xóa sản phẩm và ảnh
router.delete('/delete/:id', async (req, res) => {
    const productId = req.params.id;

    // Lấy danh sách ảnh để xóa khỏi thư mục
    const oldImages = await db.promise().query('SELECT url FROM productImage WHERE product_id = ?', [productId]);
    oldImages[0].forEach(img => {
        const filePath = path.join(__dirname, '../', img.url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Xóa ảnh cũ khỏi thư mục
        }
    });

    // Xóa bản ghi ảnh và sản phẩm
    await db.promise().query('DELETE FROM productImage WHERE product_id = ?', [productId]);
    await db.promise().query('DELETE FROM products WHERE id = ?', [productId]);

    res.json({ message: 'Product deleted successfully' });
});

// API để phục vụ các ảnh tĩnh từ thư mục 'uploads'
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = router;