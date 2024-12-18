<template>
    <a-layout-header
        style="display: flex; align-items: center; justify-content: space-between; background-color:#2e6655">
        <div class="logo">
            <!-- Logo here -->
        </div>
        <a-menu mode="horizontal" v-model:selectedKeys="selectedKeys"
            style="flex: 1; background-color:#2e6655; line-height: 64px;">
            <template v-if="true">
                <a-menu-item key="1">
                    <nuxt-link to="/" style="color: #fff;">Trang chủ</nuxt-link>
                </a-menu-item>

                <a-sub-menu key="2" @titleClick="loadCategories">
                    <template #title>
                        <span style="color: #fff;">Sản phẩm</span>
                    </template>
                    <template v-if="categories.length > 0">
                        <a-menu-item v-for="category in categories" :key="'cat-' + category.id"
                            @click="navigateToCategory(category.id)">
                            {{ category.name }}
                        </a-menu-item>
                    </template>
                </a-sub-menu>

                <a-menu-item key="3">
                    <nuxt-link to="/brands" style="color: #fff;">Thương hiệu</nuxt-link>
                </a-menu-item>
                <a-menu-item key="4">
                    <nuxt-link to="/intro" style="color: #fff;">Giới thiệu</nuxt-link>
                </a-menu-item>
                <a-menu-item key="5">
                    <nuxt-link to="/contact" style="color: #fff;">Liên hệ</nuxt-link>
                </a-menu-item>
            </template>
        </a-menu>
        <div class="right-menu">
            <SearchOutlined style="font-size: 30px; color: #fff;margin-right: 10px;" />
            <a-dropdown>
                <UserOutlined style="font-size: 30px; color: #fff;margin-right: 10px;" />
                <template #overlay>
                    <a-menu>
                        <a-menu-item @click="handleUserClick">
                            <UserOutlined />
                            Thông tin cá nhân
                        </a-menu-item>
                        <a-menu-item v-if="isCheck" @click="handleLogout">
                            <LogoutOutlined />
                            Đăng xuất
                        </a-menu-item>
                        <a-menu-item v-else @click="handleLogin">
                            <LogoutOutlined />
                            Đăng nhập
                        </a-menu-item>
                    </a-menu>
                </template>
            </a-dropdown>
            <ShoppingCartOutlined @click="handleToCart" style="font-size: 30px; color: #fff;margin-right: 10px;" />
            
        </div>
    </a-layout-header>
</template>

<script>
import { SearchOutlined, UserOutlined, ShoppingCartOutlined } from '@ant-design/icons-vue';
import axios from 'axios';
import { ref, onMounted } from 'vue';

export default {
    name: 'Header',
    components: {
        SearchOutlined,
        UserOutlined,
        ShoppingCartOutlined,
    },
    setup() {
        const categories = ref([]);
        const isLoading = ref(false);
        const selectedKeys = ref(['1']);
        const isCheck = ref(false);
        const checkLoginStatus = () => {
            const user = sessionStorage.getItem("user");
            isCheck.value = !!user; // Chuyển đổi thành boolean
        };
        const loadCategories = async () => {
            if (categories.value.length === 0 && !isLoading.value) {
                isLoading.value = true;
                try {
                    const response = await axios.get('http://localhost:5000/api/products/categories');
                    categories.value = response.data.categories;
                } catch (error) {
                    console.error('Error loading categories:', error);
                } finally {
                    isLoading.value = false;
                }
            }
        };

        const updateSelectedKey = () => {
            const path = window.location.pathname;
            if (path === '/') selectedKeys.value = ['1'];
            else if (path.includes('/product')) selectedKeys.value = ['2'];
            else if (path.includes('/brand')) selectedKeys.value = ['3'];
            else if (path.includes('/about')) selectedKeys.value = ['4'];
            else if (path.includes('/contact')) selectedKeys.value = ['5'];
        };
        const handleLogout = () => {
            try {
                sessionStorage.removeItem('user')
                message.success('Đăng xuất thành công!')
                window.location.href = '/';
            } catch (error) {
                console.error('Lỗi khi đăng xuất:', error)
                message.error('Có lỗi xảy ra khi đăng xuất!')
            }
        }

        onMounted(() => {
            checkLoginStatus();
            updateSelectedKey();
        });

        const handleUserClick = () => {
            const user = JSON.parse(sessionStorage.getItem("user"));
            if (user) {
                window.location.href = '/infor';
            } else {
                window.location.href = '/login';
            }
        };

        const navigateToCategory = (idCategory) => {
            window.location.href = `/product/${idCategory}`;
        };
        const handleToCart = () => {
            const user = JSON.parse(sessionStorage.getItem("user"));
            if (user) {
                window.location.href = '/cart';
            } else {
                alert("Vui lòng đăng nhập để vào giỏ hàng")
            }
        }
        const handleLogin = () => {
            window.location.href = '/login';
        }
        return {
            categories,
            handleToCart,
            selectedKeys,
            handleUserClick,
            navigateToCategory,
            loadCategories,
            handleLogout,
            isCheck,
            handleLogin
        };
    }
};
</script>

<style scoped>
/* Add any relevant styling as needed */
</style>
