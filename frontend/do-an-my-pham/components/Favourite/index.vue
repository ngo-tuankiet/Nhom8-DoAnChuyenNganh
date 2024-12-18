<template>
    <div>
        <h1 style="text-align: center; font-size: 50px;">DANH SÁCH SẢN PHẨM YÊU THÍCH</h1>
        <a-row :gutter="24">
            <a-col span="6" v-for="product in favouriteProducts" :key="product.id">
                <a-card class="custom-card" hoverable :title="product.title" style="margin-top: 10px;">
                    <div class="imgProduct">
                        <img :src="product.images[0]" alt="Cover Image" />
                    </div>
                    <div class="content">
                        <p class="name">{{ product.name }}</p>
                        <p class="price">{{ product.price }}</p>
                        <a-button type="primary" @click="showModal(product)">Thêm vào giỏ hàng</a-button>
                        <div class="like-button-wrapper">
                            <a-button class="like-button" @click="removeFavourite(product.id)">
                                <template #icon>
                                    <HeartOutlined style="color: red" />
                                </template>
                            </a-button>
                        </div>
                    </div>
                </a-card>
            </a-col>
        </a-row>

        <a-modal :visible="isModalVisible" title="Thông tin sản phẩm" @cancel="handleCancel" @ok="addToCart">
            <!-- Nội dung modal tương tự như trang sản phẩm -->
        </a-modal>
    </div>
</template>

<script>
export default {
    data() {
        return {
            favouriteProducts: [],
            isModalVisible: false,
            selectedProduct: {},
            quantity: 1
        };
    },
    mounted() {
        this.fetchFavouriteProducts();
    },
    methods: {
        async fetchFavouriteProducts() {
            const user = JSON.parse(sessionStorage.getItem('user'));
            if (user) {
                try {
                    const response = await fetch(`http://localhost:5000/api/products/favourites/${user.id}`);
                    console.log(response);
                    if (response.ok) {
                        const data = await response.json(); // Chờ dữ liệu JSON được trả về
                        this.favouriteProducts = data.data; // Giả sử dữ liệu nằm trong `data.data`
                    } else {
                        message.error('Có lỗi khi tải danh sách sản phẩm yêu thích');
                    }
                } catch (error) {   
                    console.error('Error fetching favourite products:', error);
                    message.error('Có lỗi khi tải danh sách sản phẩm yêu thích');
                }
            } else {
                message.warning('Vui lòng đăng nhập để xem danh sách sản phẩm yêu thích');
            }
        },

        removeFavourite(productId) {
            this.removeFavouriteProduct(productId);
        },
        async removeFavouriteProduct(productId) {
            const user = JSON.parse(sessionStorage.getItem('user'));
            if (user) {
                try {
                    const response = await fetch(`http://localhost:5000/api/products/favourites/${user.id}/${productId}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        this.favouriteProducts = this.favouriteProducts.filter(p => p.id !== productId);
                        message.success('Đã xóa sản phẩm khỏi danh sách yêu thích');
                    } else {
                        message.error('Có lỗi khi xóa sản phẩm khỏi danh sách yêu thích');
                    }
                } catch (error) {
                    console.error('Error removing favourite product:', error);
                    message.error('Có lỗi khi xóa sản phẩm khỏi danh sách yêu thích');
                }
            } else {
                message.warning('Vui lòng đăng nhập để sử dụng chức năng này');
            }
        },
        // Các phương thức khác (showModal, addToCart, handleCancel) tương tự như trang sản phẩm
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