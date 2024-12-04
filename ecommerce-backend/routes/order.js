const express = require('express');
const router = express.Router();
const db = require('../config/db');

const generateOrderCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// API tạo đơn hàng
router.post('/create', (req, res) => {
    const { items, customer, totalAmount } = req.body;
    const orderCode = generateOrderCode();

    // Bắt đầu transaction
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi bắt đầu transaction'
            });
        }

        // 1. Tạo đơn hàng mới
        const orderSql = `
            INSERT INTO orders (code, user_id, total_amount, status, created_at, 
                customer_name, customer_phone, customer_address, note)
            VALUES (?, ?, ?, 1, NOW(), ?, ?, ?, ?)
        `;

        const orderValues = [
            orderCode,
            customer.userId || null,
            totalAmount,
            customer.fullName,
            customer.phone,
            customer.address,
            customer.note || null
        ];

        db.query(orderSql, orderValues, (error, orderResult) => {
            if (error) {
                return db.rollback(() => {
                    res.status(500).json({
                        success: false,
                        message: 'Lỗi khi tạo đơn hàng',
                        error: error.message
                    });
                });
            }

            const orderId = orderResult.insertId;

            // 2. Tạo chi tiết đơn hàng
            const orderDetailsSql = `
                INSERT INTO order_details (order_id, product_id, quantity, price)
                VALUES ?
            `;

            const orderDetailsValues = items.map(item => [
                orderId,
                item.id,
                item.quantity,
                item.price
            ]);

            db.query(orderDetailsSql, [orderDetailsValues], (error) => {
                if (error) {
                    return db.rollback(() => {
                        res.status(500).json({
                            success: false,
                            message: 'Lỗi khi tạo chi tiết đơn hàng',
                            error: error.message
                        });
                    });
                }

                // Commit transaction nếu mọi thứ OK
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: 'Lỗi khi commit transaction'
                            });
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: 'Đặt hàng thành công',
                        data: {
                            orderId: orderId,
                            orderCode: orderCode
                        }
                    });
                });
            });
        });
    });
});
// API lấy danh sách đơn hàng
router.get('/list', (req, res) => {
    const sql = `
        SELECT o.*, COUNT(od.id) as total_items 
        FROM orders o
        LEFT JOIN order_details od ON o.id = od.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách đơn hàng',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});
router.get('/list/:status', (req, res) => {
    const status = req.params.status;
    const sql = `
        SELECT o.*, COUNT(od.id) as total_items 
        FROM orders o
        LEFT JOIN order_details od ON o.id = od.order_id
        WHERE o.status = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `;

    db.query(sql, [status], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách đơn hàng',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});
router.get('/top-products', (req, res) => {
    const topProductsSql = `
        SELECT p.id,
               p.name,
               p.description,
               p.price,
               p.stock,
               p.brand_id,
               p.subcategory_id,
               b.brand_name as brand_name,
               GROUP_CONCAT(JSON_OBJECT('id', pi.id, 'url', pi.url)) as product_images
        FROM order_details od
        JOIN products p ON od.product_id = p.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN productimage pi ON p.id = pi.product_id
        GROUP BY p.id, p.name, p.description, p.price, p.stock, p.brand_id, p.subcategory_id, b.brand_name
        ORDER BY SUM(od.quantity) DESC
        LIMIT 5
    `;

    db.query(topProductsSql, (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách sản phẩm bán chạy nhất',
                error: error.message
            });
        }

        const topProducts = results.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            stock: item.stock,
            brand_id: item.brand_id,
            subcategory_id: item.subcategory_id,
            brand_name: item.brand_name,
            images: item.product_images ? JSON.parse(`[${item.product_images}]`) : []
        }));

        res.json({
            success: true,
            data: topProducts
        });
    });
});
router.get('/listorder/:userid', (req, res) => {
    const userId = req.params.userid;
    const sql = `
        SELECT o.*, COUNT(od.id) as total_items 
        FROM orders o
        LEFT JOIN order_details od ON o.id = od.order_id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `;

    db.query(sql, [userId], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách đơn hàng',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});
// API lấy chi tiết đơn hàng
router.get('/detail/:id', (req, res) => {
    const orderId = req.params.id;

    // Query để lấy thông tin đơn hàng và hình ảnh sản phẩm
    const orderSql = `
        SELECT o.*, 
               od.product_id, 
               od.quantity, 
               od.price,
               p.name as product_name,
               GROUP_CONCAT(DISTINCT pi.url) as product_images
        FROM orders o
        JOIN order_details od ON o.id = od.order_id
        JOIN products p ON od.product_id = p.id
        LEFT JOIN productimage pi ON p.id = pi.product_id
        WHERE o.id = ?
        GROUP BY o.id, od.id, od.product_id, od.quantity, od.price, p.name
    `;

    db.query(orderSql, [orderId], (error, results) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy chi tiết đơn hàng',
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Định dạng lại dữ liệu
        const orderDetails = results.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            images: item.product_images ? item.product_images.split(',') : [] // Kiểm tra null/undefined
        }));

        const orderInfo = {
            id: results[0].id,
            code: results[0].code,
            user_id: results[0].user_id,
            total_amount: results[0].total_amount,
            status: results[0].status,
            created_at: results[0].created_at,
            customer_name: results[0].customer_name,
            customer_phone: results[0].customer_phone,
            customer_address: results[0].customer_address,
            note: results[0].note,
            items: orderDetails
        };

        res.json({
            success: true,
            data: orderInfo
        });
    });
});

// API cập nhật trạng thái đơn hàng
router.put('/status/:id', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    const sql = `
        UPDATE orders 
        SET status = ?
        WHERE id = ?
    `;

    db.query(sql, [status, orderId], (error, result) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật trạng thái đơn hàng',
                error: error.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công'
        });
    });
});

module.exports = router;