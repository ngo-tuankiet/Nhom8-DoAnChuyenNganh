<template>
    <div>
        <div class="slider">
            <div v-for="(image, index) in images" :key="index" class="slide"
                :class="{ active: index === currentIndex }">
                <img :src="image" alt="slide image" />
            </div>
        </div>
        <a-row type="flex" justify="center" align="middle" style="height: 100px;">
            <a-col>
                <h1 style="font-size: 50px;margin-bottom: 150px;">TOP SẢN PHẨM BÁN CHẠY</h1>
            </a-col>
        </a-row>

        <a-row :gutter="24" style="margin-top: 100px; justify-content: center">
            <a-col span="6" v-for="product in products" :key="product.id">
                <a-card class="custom-card" hoverable :title="product.title" style="margin-top: 10px;">
                    <div class="imgProduct">
                        <img :src="product.images[0].url" alt="Cover Image" />
                    </div>
                    <div class="content">
                        <p class="name">{{ product.name }}</p>
                        <p class="price">{{ product.price }}</p>
                        <a-button type="primary" @click="showModal(product)">Thêm vào giỏ hàng</a-button>
                        <div class="like-button-wrapper">
                            <a-button class="like-button" @click="toggleLike(product.id)">
                                <template #icon>
                                    <HeartFilled
                                        :style="{ color: likedProducts.includes(product.id) ? 'red' : 'inherit' }" />
                                </template>
                            </a-button>
                        </div>
                    </div>
                </a-card>
            </a-col>
        </a-row>

        <a-modal :visible="isModalVisible" title="Thông tin sản phẩm" @cancel="handleCancel" @ok="addToCart">
            <img :src="selectedProduct.images[0].url" alt="Cover Image" style="max-width: 100%;" />
            <h3>{{ selectedProduct.name }}</h3>
            <p class="price">{{ selectedProduct.price }}</p>
            <div class="quantity-control">
                <a-button @click="decrementQuantity" :disabled="quantity <= 1">-</a-button>
                <span class="quantity">{{ quantity }}</span>
                <a-button @click="incrementQuantity">+</a-button>
            </div>
        </a-modal>
    </div>
</template>

<script>
import { MinusOutlined, PlusOutlined, HeartFilled } from '@ant-design/icons-vue';
import axios from 'axios';
export default {
    name: 'Index',
    components: {
        MinusOutlined,
        HeartFilled,
        PlusOutlined,
    },
    data() {
        return {
            images: [
                'https://file.hstatic.net/1000391653/file/slider-ct-28---31__1__master.jpg',
                'https://file.hstatic.net/1000391653/file/crazynight-new_1_master.jpg',
                'https://file.hstatic.net/1000391653/file/dbt-new_1_master.jpg'
            ],
            currentIndex: 0,

            favoriteProducts: [
                {
                    id: 1,
                    title: "Bộ quà tặng 2 nến Mini Holiday 2022",
                    coverImage: 'https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_4tf8JrrMSme7E5d9_img_220x220_0dff4c_fit_center.png',
                    price: "3.040.000₫",
                },
                {
                    id: 2,
                    title: "Bộ tinh dầu toả hương Gabriele 350ML",
                    coverImage: 'https://media.hcdn.vn/catalog/product/f/a/facebook-dynamic-318900012-1696306376_img_220x220_0dff4c_fit_center.jpg',
                    price: "5.760.000₫",
                },
            ],
            products: [],
            isModalVisible: false,
            selectedProduct: {},
            quantity: 1,
            page: 1,
            limit: 10,
            totalProducts: 0,
            likedProducts: []
        };
    },
    mounted() {
        this.startSlideShow();
    },
    methods: {
        startSlideShow() {
            setInterval(() => {
                this.currentIndex = (this.currentIndex + 1) % this.images.length;
            }, 2000);
        },
        async fetchProducts() {
            try {
                const response = await axios.get(`http://localhost:5000/api/order/top-products`, {

                });
                console.log(response.data.data)
                this.products = response.data.data;
                // this.totalProducts = response.data.total;
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        },
        showModal(product) {
            this.selectedProduct = product;
            this.isModalVisible = true;
        },
        handleCancel() {
            this.isModalVisible = false;
            this.quantity = 1;
        },

        addToCart() {
            try {
                const user = JSON.parse(sessionStorage.getItem("user"));
                if (user) {
                    let cart = [];
                    const existingCart = sessionStorage.getItem('cart');
                    if (existingCart) {
                        cart = JSON.parse(existingCart);
                    }

                    // Tạo object sản phẩm để thêm vào giỏ hàng
                    const productToAdd = {
                        id: this.selectedProduct.id,
                        name: this.selectedProduct.name,
                        price: this.selectedProduct.price,
                        images: this.selectedProduct.images,
                        quantity: this.quantity
                    };

                    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
                    const existingProductIndex = cart.findIndex(item => item.id === productToAdd.id);

                    if (existingProductIndex !== -1) {
                        // Nếu sản phẩm đã có trong giỏ hàng, cộng thêm số lượng
                        cart[existingProductIndex].quantity += this.quantity;
                    } else {
                        // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
                        cart.push(productToAdd);
                    }

                    // Lưu giỏ hàng vào session
                    sessionStorage.setItem('cart', JSON.stringify(cart));

                    // Hiển thị thông báo thành công
                    message.success(`Đã thêm ${this.quantity} ${this.selectedProduct.name} vào giỏ hàng`);

                    // Đóng modal và reset số lượng
                    this.isModalVisible = false;
                    this.quantity = 1;

                    // Tùy chọn: Thêm hiệu ứng cho icon giỏ hàng (nếu có)
                    this.updateCartCount();
                } else {
                    alert("Vui lòng đăng nhập để thêm vào giỏ hàng")
                }
                // Lấy giỏ hàng hiện tại từ session


            } catch (error) {
                console.error('Error adding to cart:', error);
                this.$message.error('Có lỗi xảy ra khi thêm vào giỏ hàng');
            }
        },

        // Phương thức để cập nhật số lượng sản phẩm trong icon giỏ hàng (tùy chọn)
        updateCartCount() {
            const cart = sessionStorage.getItem('cart');
            if (cart) {
                const cartItems = JSON.parse(cart);
                // Nếu bạn có component hiển thị số lượng sản phẩm trong giỏ hàng
                // this.cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
            }
        },
        async toggleLike(id) {
            try {
                const user = JSON.parse(sessionStorage.getItem('user'));
                if (user) {
                    const isLiked = this.likedProducts.includes(id);
                    // Gọi API để thêm/xóa sản phẩm khỏi danh sách yêu thích
                    const response = await fetch(`http://localhost:5000/api/products/favourites`, {
                        method: this.isLiked ? 'DELETE' : 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            userId: user.id,
                            productId: id
                        })
                    });

                    if (response.ok) {
                        if (isLiked) {
                            this.likedProducts = this.likedProducts.filter(x => x !== id);
                        } else {
                            this.likedProducts.push(id);
                        }
                        message.success(`Đã ${isLiked ? 'xóa' : 'thêm'} sản phẩm vào danh sách yêu thích`);
                    } else {
                        message.error('Có lỗi khi cập nhật danh sách yêu thích');
                    }
                } else {
                    message.warning('Vui lòng đăng nhập để sử dụng chức năng này');
                }
            } catch (error) {
                console.log('Error toggling like:', error);
                message.error('Có lỗi khi cập nhật danh sách yêu thích');
            }
        }
        ,
        incrementQuantity() {
            this.quantity++;
        },
        decrementQuantity() {
            if (this.quantity > 1) {
                this.quantity--;
            }
        },
    },
    mounted() {
        this.fetchProducts();
    },
    watch: {
        '$route.params': 'fetchProducts'
    }

};
</script>

<style scoped>
.slider {
    position: relative;
    width: 100%;
    height: 500px;
    overflow: hidden;
}

.slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.slide {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.5s ease, transform 0.5s ease;
    transform: translateX(100%);
}

.slide.active {
    opacity: 1;
    transform: translateX(0);
}

.favorite-products {
    margin-top: 20px;
}

.product {
    display: inline-block;
    width: 150px;
    margin: 10px;
    text-align: center;
}

.custom-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 400px;
    text-align: center;
}

.content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
}

.imgProduct {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

img {
    width: 50%;
    height: 100%;
}

.price {
    color: red;
    font-weight: bold;
}

.quantity-control {
    display: flex;
    align-items: center;
    justify-content: center;
}

.quantity {
    margin: 0 10px;
}

.like-button-wrapper {
    position: absolute;
    top: 10px;
    right: 10px;
}

.like-button {
    padding: 0 !important;
    width: 30px;
    height: 30px;
}
</style>
