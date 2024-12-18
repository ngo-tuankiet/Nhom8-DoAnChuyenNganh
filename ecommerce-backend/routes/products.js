// routes/products.js
const express = require('express');
const multer = require('multer');
const db = require('../config/db');

const path = require('path');
const fs = require('fs');
const router = express.Router();
const BASE_URL = 'http://localhost:5000'; // Thay bằng domain thực tế nếu có
// // Cấu hình multer
// const upload = multer({
//     storage: multer.memoryStorage()
// });
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({ storage });
// Lấy danh sách sản phẩm có phân trang và lọc theo tên
router.get('/', (req, res) => {
    const { page = 1, limit = 10, name } = req.query;
    const offset = (page - 1) * limit;

    // Base query với LEFT JOIN để lấy thông tin ảnh
    let sql = `
        SELECT p.*, 
               GROUP_CONCAT(pi.id) as image_ids,
               GROUP_CONCAT(pi.url) as image_urls
        FROM products p
        LEFT JOIN productimage pi ON p.id = pi.product_id
    `;

    let sqlCount = 'SELECT COUNT(DISTINCT p.id) as total FROM products p';
    const params = [];

    // Thêm điều kiện lọc theo tên nếu có
    if (name) {
        sql += ' WHERE p.name LIKE ?';
        sqlCount += ' WHERE p.name LIKE ?';
        params.push(`%${name}%`);
    }

    // Thêm GROUP BY để gom nhóm ảnh theo sản phẩm
    sql += ' GROUP BY p.id';

    // Thêm LIMIT và OFFSET cho phân trang
    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    // Thực hiện query đếm tổng số sản phẩm
    db.query(sqlCount, params.slice(0, params.length - 2), (err, countResults) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err.message });

        const total = countResults[0].total;

        // Thực hiện query chính
        db.query(sql, params, (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error', details: err.message });

            // Xử lý kết quả để format dữ liệu trả về
            const formattedResults = results.map(product => {
                const images = [];

                // Kiểm tra và xử lý danh sách ảnh
                if (product.image_ids && product.image_urls) {
                    const ids = product.image_ids.split(',');
                    const urls = product.image_urls.split(',').map(image => `${BASE_URL}/${image}`);

                    for (let i = 0; i < ids.length; i++) {
                        images.push({
                            id: ids[i],
                            url: urls[i]
                        });
                    }
                }

                // Xóa các trường không cần thiết và thêm mảng images
                delete product.image_ids;
                delete product.image_urls;

                return {
                    ...product,
                    images
                };
            });

            // Trả về kết quả
            res.json({
                total,
                page: Number(page),
                limit: Number(limit),
                products: formattedResults
            });
        });
    });
});

// Lấy chi tiết một sản phẩm
router.get('/category', (req, res) => {
    const query = `
        SELECT c.id as category_id,
               c.category_name,
               s.id as subcategory_id,
               s.subcategory_name
        FROM categories c
        LEFT JOIN subcategories s ON c.id = s.category_id
        ORDER BY c.id, s.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Restructure data for frontend
        const categories = [];
        let currentCategory = null;

        results.forEach(row => {
            if (!currentCategory || currentCategory.id !== row.category_id) {
                currentCategory = {
                    id: row.category_id,
                    name: row.category_name,
                    subcategories: []
                };
                categories.push(currentCategory);
            }
            if (row.subcategory_id) {
                currentCategory.subcategories.push({
                    id: row.subcategory_id,
                    name: row.subcategory_name
                });
            }
        });

        res.json(categories);
    });
});
router.get('/categories', (req, res) => {
    const { page = 1, limit = 10, name } = req.query;
    const offset = (page - 1) * limit;

    // Câu truy vấn chính để lấy các category, có thể lọc theo tên nếu có
    let sql = `SELECT * FROM categories`;
    let sqlCount = `SELECT COUNT(*) as total FROM categories`;
    const params = [];

    // Thêm điều kiện lọc theo tên nếu có
    if (name) {
        sql += ` WHERE name LIKE ?`;
        sqlCount += ` WHERE name LIKE ?`;
        params.push(`%${name}%`);
    }

    // Thêm LIMIT và OFFSET cho phân trang
    sql += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    // Thực hiện query đếm tổng số danh mục
    db.query(sqlCount, params.slice(0, params.length - 2), (err, countResults) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err.message });

        const total = countResults[0].total;

        // Thực hiện query chính để lấy danh sách category
        db.query(sql, params, (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error', details: err.message });

            // Trả về kết quả
            res.json({
                total,
                page: Number(page),
                limit: Number(limit),
                categories: results
            });
        });
    });
});
      


// Lấy danh sách sản phẩm theo subcategory ID
router.get('/subcategory/:subcategoryId', (req, res) => {
    const { subcategoryId } = req.params;
    const { page = 1, limit = 10, name } = req.query;
    const offset = (page - 1) * limit;

    // Câu truy vấn để lấy sản phẩm theo subcategory ID, kèm brand và ảnh nếu có
    let sql = `
        SELECT p.*, 
               b.brand_name as brand_name,
               GROUP_CONCAT(pi.id) as image_ids,
               GROUP_CONCAT(pi.url) as image_urls
        FROM products p
        LEFT JOIN productimage pi ON p.id = pi.product_id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.subcategory_id = ?
    `;

    let sqlCount = 'SELECT COUNT(DISTINCT p.id) as total FROM products p WHERE p.subcategory_id = ?';
    const params = [subcategoryId];

    // Thêm điều kiện lọc theo tên nếu có
    if (name) {
        sql += ' AND p.name LIKE ?';
        sqlCount += ' AND p.name LIKE ?';
        params.push(`%${name}%`);
    }

    // Thêm GROUP BY để gom nhóm ảnh theo sản phẩm
    sql += ' GROUP BY p.id';

    // Thêm LIMIT và OFFSET cho phân trang
    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    // Thực hiện query đếm tổng số sản phẩm
    db.query(sqlCount, params.slice(0, params.length - 2), (err, countResults) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err.message });

        const total = countResults[0].total;

        // Thực hiện query chính
        db.query(sql, params, (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error', details: err.message });

            // Xử lý kết quả để format dữ liệu trả về
            const formattedResults = results.map(product => {
                const images = [];

                // Kiểm tra và xử lý danh sách ảnh
                if (product.image_ids && product.image_urls) {
                    const ids = product.image_ids.split(',');
                    const urls = product.image_urls.split(',').map(image => `${BASE_URL}/${image}`);

                    for (let i = 0; i < ids.length; i++) {
                        images.push({
                            id: ids[i],
                            url: urls[i]
                        });
                    }
                }

                // Xóa các trường không cần thiết và thêm mảng images
                delete product.image_ids;
                delete product.image_urls;

                return {
                    ...product,
                    brand: product.brand_name,  // Thêm thông tin tên brand vào đối tượng sản phẩm
                    images
                };
            });

            // Trả về kết quả
            res.json({
                total,
                page: Number(page),
                limit: Number(limit),
                products: formattedResults
            });
        });
    });
});
router.get('/brand/:brandId', (req, res) => {
    const { brandId } = req.params;
    const { page = 1, limit = 10, name } = req.query;
    const offset = (page - 1) * limit;

    // Câu truy vấn để lấy sản phẩm theo brand ID, kèm brand và ảnh nếu có
    let sql = `
        SELECT p.*, 
               b.brand_name as brand_name,
               GROUP_CONCAT(pi.id) as image_ids,
               GROUP_CONCAT(pi.url) as image_urls
        FROM products p
        LEFT JOIN productimage pi ON p.id = pi.product_id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.brand_id = ?
    `;

    let sqlCount = 'SELECT COUNT(DISTINCT p.id) as total FROM products p WHERE p.brand_id = ?';
    const params = [brandId];

    // Thêm điều kiện lọc theo tên nếu có
    if (name) {
        sql += ' AND p.name LIKE ?';
        sqlCount += ' AND p.name LIKE ?';
        params.push(`%${name}%`);
    }

    // Thêm GROUP BY để gom nhóm ảnh theo sản phẩm
    sql += ' GROUP BY p.id';

    // Thêm LIMIT và OFFSET cho phân trang
    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    // Thực hiện query đếm tổng số sản phẩm
    db.query(sqlCount, params.slice(0, params.length - 2), (err, countResults) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err.message });

        const total = countResults[0].total;

        // Thực hiện query chính
        db.query(sql, params, (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error', details: err.message });

            // Xử lý kết quả để format dữ liệu trả về
            const formattedResults = results.map(product => {
                const images = [];
                if (product.image_ids && product.image_urls) {
                    const ids = product.image_ids.split(',');
                   
                    const urls = product.image_urls.split(',').map(image => `${BASE_URL}/${image}`);
                    for (let i = 0; i < ids.length; i++) {
                        images.push({ id: ids[i], url: urls[i] });
                    }
                }

                return {
                    ...product,
                    images,
                    image_ids: undefined,
                    image_urls: undefined
                };
            });

            // Trả về kết quả và thông tin phân trang
            res.json({
                total,
                page: Number(page),
                limit: Number(limit),
                products: formattedResults
            });
        });
    });
});

// API to create a new product and save multiple images
router.post('/create', upload.array('images', 10), async (req, res) => {
    const { name, description, price, stock, brand_id, subcategory_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    // Check if brand_id and subcategory_id exist
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

        // Insert the product into the products table
        const sqlProduct = `
            INSERT INTO products 
            (name, description, price, stock, brand_id, subcategory_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(sqlProduct,
            [name, description, price, stock, brand_id, subcategory_id],
            (err, result) => {
                if (err) {
                    console.error('Error inserting product:', err);
                    return res.status(500).json({ error: 'Error inserting product' });
                }

                const productId = result.insertId;

                // Save the uploaded images to the local uploads folder and store the file paths in the productImage table
                const imageUrls = [];
                for (const file of files) {
                    const imagePath = `uploads/${file.filename}`;
                    const sqlImage = `INSERT INTO productImage (product_id, url) VALUES (?, ?)`;
                    db.query(sqlImage, [productId, imagePath], (err) => {
                        if (err) {
                            console.error('Error inserting image URL:', err);
                            return res.status(500).json({ error: 'Error inserting image URL' });
                        }
                        imageUrls.push(imagePath);
                    });
                }

                res.status(201).json({
                    message: 'Product created successfully',
                    productId,
                    images: imageUrls
                });
            }
        ); 
    });
});

// API to update a product and its images
router.put('/update/:id', upload.array('images', 10), async (req, res) => {
    const productId = req.params.id;
    const { name, description, price, stock, brand_id, subcategory_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    // Check if brand_id and subcategory_id exist
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

    // Update the product information
    const sqlUpdateProduct = `
        UPDATE products 
        SET name = ?, description = ?, price = ?, stock = ?, brand_id = ?, subcategory_id = ?
        WHERE id = ?
    `;

    await db.promise().query(sqlUpdateProduct, [
        name, description, price, stock, brand_id, subcategory_id, productId
    ]);

    // If there are new files, delete the old images and upload the new ones
    if (files && files.length > 0) {
        // Delete old images
        await db.promise().query('DELETE FROM productImage WHERE product_id = ?', [productId]);

        // Upload new images
        const imageUrls = [];
        for (const file of files) {
            const imagePath = `uploads/${file.filename}`;
            const sqlImage = `INSERT INTO productImage (product_id, url) VALUES (?, ?)`;
            await db.promise().query(sqlImage, [productId, imagePath]);
            imageUrls.push(imagePath);
        }

        return res.json({
            message: 'Product updated successfully',
            productId,
            images: imageUrls
        });
    } else {
        return res.json({ message: 'Product updated successfully' });
    }
});

// API to delete a product and its images
router.delete('/delete/:id', (req, res) => {
    const productId = req.params.id;

    // Lấy danh sách ảnh
    const getImages = `SELECT url FROM productImage WHERE product_id = ?`;
    db.query(getImages, [productId], (err, images) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching images' });
        }

        // Xóa từng ảnh trong thư mục
        images.forEach((image) => {
            const fileName = path.basename(image.url);
            const filePath = path.join('uploads', fileName);
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        });

        // Xóa ảnh trong bảng productImage
        db.query('DELETE FROM productImage WHERE product_id = ?', [productId], (delImageErr) => {
            if (delImageErr) {
                return res.status(500).json({ error: 'Error deleting product images' });
            }

            // Xóa sản phẩm trong bảng products
            db.query('DELETE FROM products WHERE id = ?', [productId], (delProductErr) => {
                if (delProductErr) {
                    return res.status(500).json({ error: 'Error deleting product' });
                }
                res.json({ message: 'Product deleted successfully' });
            });
        });
    });
});

// API lấy danh sách sản phẩm
router.get('/list', async (req, res) => {
    const sql = `
        SELECT 
            p.*,
            b.brand_name,
            c.name as category_name,
            GROUP_CONCAT(pi.url) as images
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.subcategory_id = c.id
        LEFT JOIN productImage pi ON p.id = pi.product_id
        GROUP BY p.id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching products' });
        }

        // Format lại kết quả để images thành mảng
        const formattedResults = results.map(product => ({
            ...product,
            images: product.images
                ? product.images.split(',').map(image => `${BASE_URL}/${image}`)
                : []
        }));

        res.json(formattedResults);
    });
});


// API để lấy danh sách thương hiệu
router.get('/brands', (req, res) => {
    db.query('SELECT * FROM brands', (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error retrieving brands' });
        }
        res.json(results);
    });
});

// API để lấy danh sách danh mục
router.get('/listcategories', (req, res) => {
    db.query('SELECT * FROM categories', (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error retrieving categories' });
        }
        res.json(results);
    });
});
router.get('/:id', (req, res) => {
    const productId = req.params.id;
    const sql = `
        SELECT 
            p.*,
            GROUP_CONCAT(pi.url) AS images
        FROM products p
        LEFT JOIN productImage pi ON p.id = pi.product_id
        WHERE p.id = ?
        GROUP BY p.id
    `;

    db.query(sql, [productId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching product details' });
        if (results.length === 0) return res.status(404).json({ error: 'Product not found' });

        const product = results[0];

        // Format lại hình ảnh với domain đầy đủ
        product.images = product.images
            ? product.images.split(',').map(image => `${BASE_URL}/${image}`)
            : [];

        res.json(product);
    });
});
// Thêm sản phẩm vào danh sách yêu thích
router.post('/favourites', (req, res) => {
    const { userId, productId } = req.body;

    const sql = `
      INSERT INTO favourites (user_id, product_id)
      VALUES (?, ?)
    `;

    db.query(sql, [userId, productId], (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi thêm sản phẩm vào danh sách yêu thích',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Thêm sản phẩm vào danh sách yêu thích thành công'
        });
    });
});

// Xóa sản phẩm khỏi danh sách yêu thích
router.delete('/favourites', (req, res) => {
    const { userId, productId } = req.body;

    const sql = `
      DELETE FROM favourites
      WHERE user_id = ? AND product_id = ?
    `;

    db.query(sql, [userId, productId], (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa sản phẩm khỏi danh sách yêu thích',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'thêm sản phẩm vào danh sách yêu thích thành công'
        });
    });
});
// Lấy danh sách sản phẩm yêu thích của người dùng
router.get('/favourites/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = `
      SELECT 
        p.*, 
        GROUP_CONCAT(DISTINCT pi.url) AS images
      FROM favourites f
      JOIN products p ON f.product_id = p.id
      LEFT JOIN productimage pi ON p.id = pi.product_id
      WHERE f.user_id = ?
      GROUP BY p.id
    `;

    db.query(sql, [userId], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách sản phẩm yêu thích',
                error: error.message
            });
        }

        const formattedResults = results.map(result => ({
            ...result,
            images:  result.images
            ? result.images.split(',').map(image => `${BASE_URL}/${image}`)
            : []
        }));

        res.json({
            success: true,
            data: formattedResults
        });
    });
});


// Xóa sản phẩm khỏi danh sách yêu thích
router.delete('/favourites/:userId/:productId', (req, res) => {
    const { userId, productId } = req.params;

    const sql = `
      DELETE FROM favourites
      WHERE user_id = ? AND product_id = ?
    `;

    db.query(sql, [userId, productId], (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa sản phẩm khỏi danh sách yêu thích',
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong danh sách yêu thích'
            });
        }

        res.json({
            success: true,
            message: 'Xóa sản phẩm khỏi danh sách yêu thích thành công'
        });
    });
});
module.exports = router;
