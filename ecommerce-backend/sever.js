const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const  userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories'); // Routes liên quan đến danh mục
const brandRoutes = require('./routes/brands');
const orderRoutes = require('./routes/order');
const path = require('path');
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use('/api/users', userRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/order', orderRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
