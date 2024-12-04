<template>
    <a-layout-sider width="250" theme="light">
        <a-menu mode="inline" defaultSelectedKeys="['1']">
            <a-menu-item key="1">
                <UserOutlined />
                Thông tin chi tiết
            </a-menu-item>
            <a-menu-item key="2">
                <HeartOutlined />
                Yêu thích
            </a-menu-item>
            <a-menu-item key="3">
                <ShoppingCartOutlined />
                Đơn hàng
            </a-menu-item>
            <a-menu-item key="4">
                <LockOutlined />
                Cập nhật mật khẩu
            </a-menu-item>
            <a-menu-item key="5">
                <LogoutOutlined />
                Đăng xuất
            </a-menu-item>
        </a-menu>
    </a-layout-sider>
</template>

<script>
import { UserOutlined, HeartOutlined, ShoppingCartOutlined, LockOutlined, LogoutOutlined } from '@ant-design/icons-vue';

export default {
    name: 'Sidebar',
    components: {
        UserOutlined,
        HeartOutlined,
        ShoppingCartOutlined,
        LockOutlined,
        LogoutOutlined,
    },
    mounted() {
        console.log('Sidebar mounted');
    },
}
</script>

<style scoped>
/* Optional styling */
</style>
