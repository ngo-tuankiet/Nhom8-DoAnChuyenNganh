<template>
    <div class="register-page">
        <div class="register-form">
            <h2>ĐĂNG NHẬP</h2>
            <a-form @submit.prevent="onSubmit"> <!-- Sửa lỗi submit -->
                <a-form-item>
                    <a-input v-model:value="username" placeholder="Tên tài khoản" />
                </a-form-item>
                <a-form-item>
                    <a-input-password v-model:value="password" placeholder="Mật khẩu" />
                </a-form-item>
                <a-button type="primary" style="background-color: black;" html-type="submit" block>
                    Đăng Nhập
                </a-button>
                <div class="login-option">
                    <span>Đã chưa tài khoản?</span>
                    <nuxt-link to="/register">Đăng Ký Ngay</nuxt-link>
                </div>
            </a-form>
        </div>
    </div>
</template>

<script setup lang="ts">

const router = useRouter();

const username = ref('');
const password = ref('');

const onSubmit = async () => {
    try {
        const payload = {
            username: username.value,
            password: password.value,
        };

        await $fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            body: payload,
        }).then((res: any) => {
            sessionStorage.setItem("user", JSON.stringify(res.user))
            // Kiểm tra role của user để điều hướng trang
            if (res.user.role === 1) {
                router.push('/');
            } else if (res.user.role === 2) {
                router.push('/admin');
            } else {
                message.error('Role không hợp lệ!');
            }
        });
        message.success('Đăng nhập thành công!');
    } catch (error) {
        message.error('Đăng nhập thất bại! Vui lòng thử lại.');
        console.error(error);
    }
};
</script>

<style scoped>
.register-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-size: cover;
}

.register-form {
    background-color: rgba(255, 255, 255, 0.9);
    padding: 30px;
    border-radius: 10px;
    width: 400px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

h2 {
    text-align: center;
    margin-bottom: 20px;
}

.login-option {
    margin-top: 15px;
    text-align: center;
}

.login-option span {
    margin-right: 5px;
}
</style>