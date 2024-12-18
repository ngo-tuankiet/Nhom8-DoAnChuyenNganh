<template>
    <div>
        <h1 style="text-align: center; font-size: 50px;">SẢN PHẨM THEO THƯƠNG HIỆU</h1>
        <a-row :gutter="24">
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
            <img :src="selectedProduct.images?.[0].url" alt="Cover Image" style="max-width: 100%;" />
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
import { message } from 'ant-design-vue';
import axios from 'axios';

export default {
    data() {
        return {
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
    components: {
        MinusOutlined,
        HeartFilled,
        PlusOutlined,
    },
    methods: {
        async fetchProducts() {
            const { id } = this.$route.params;
            try {
                const response = await axios.get(`http://localhost:5000/api/products/brand/${id}`, {
                    params: {
                        page: this.page,
                        limit: this.limit
                    }
                });
                this.products = response.data.products;
                this.totalProducts = response.data.total;
            } catch (error) {
                console.error('Error fetching products:', error);
                message.error('Có lỗi khi tải danh sách sản phẩm');
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
                if (!user) {
                    message.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
                    return;
                }

                let cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
                const productToAdd = {
                    id: this.selectedProduct.id,
                    name: this.selectedProduct.name,
                    price: this.selectedProduct.price,
                    images: this.selectedProduct.images,
                    quantity: this.quantity
                };

                const existingProductIndex = cart.findIndex(item => item.id === productToAdd.id);
                if (existingProductIndex !== -1) {
                    cart[existingProductIndex].quantity += this.quantity;
                } else {
                    cart.push(productToAdd);
                }

                sessionStorage.setItem('cart', JSON.stringify(cart));
                message.success(`Đã thêm ${this.quantity} ${this.selectedProduct.name} vào giỏ hàng`);
                this.isModalVisible = false;
                this.quantity = 1;
                this.updateCartCount();
            } catch (error) {
                console.error('Error adding to cart:', error);
                message.error('Có lỗi xảy ra khi thêm vào giỏ hàng');
            }
        },
        updateCartCount() {
            const cart = sessionStorage.getItem('cart');
            if (cart) {
                const cartItems = JSON.parse(cart);
                // Cập nhật số lượng trong giỏ hàng nếu cần
            }
        },
        async toggleLike(id) {
            try {
                const user = JSON.parse(sessionStorage.getItem('user'));
                if (!user) {
                    message.warning('Vui lòng đăng nhập để sử dụng chức năng này');
                    return;
                }

                const isLiked = this.likedProducts.includes(id);
                const response = await fetch(`http://localhost:5000/api/products/favourites`, {
                    method: isLiked ? 'DELETE' : 'POST',
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
                    // message.success(`Đã ${isLiked ? 'xóa' : 'thêm'} sản phẩm ${isLiked ? 'khỏi' : 'vào'} danh sách yêu thích`);
                    message.success(`Đã ${isLiked ? 'xóa' : 'thêm'} sản phẩm vào danh sách yêu thích`);
                    
                } else {
                    message.error('Có lỗi khi cập nhật danh sách yêu thích');
                }
            } catch (error) {
                console.error('Error toggling like:', error);
                message.error('Có lỗi khi cập nhật danh sách yêu thích');
            }
        },
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