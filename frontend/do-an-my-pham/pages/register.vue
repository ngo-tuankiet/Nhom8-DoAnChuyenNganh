<template>
    <div class="register-page">
        <div class="register-form">
            <h2>ĐĂNG KÝ</h2>
            <a-form @submit.prevent="onSubmit"> <!-- Sửa lỗi submit -->
                <a-form-item>
                    <a-input v-model:value="username" placeholder="Tên tài khoản" />
                </a-form-item>
                <a-form-item>
                    <a-input v-model:value="fullname" placeholder="Tên khách hàng" />
                </a-form-item>
                <a-form-item>
                    <a-input v-model:value="email" type="email" placeholder="Email" />
                </a-form-item>
                <a-form-item>
                    <a-input-password v-model:value="password" placeholder="Mật khẩu" />
                </a-form-item>
                <a-form-item>
                    <a-input-password v-model:value="confirmPassword" placeholder="Xác nhận mật khẩu" />
                </a-form-item>
                <a-button type="primary" style="background-color: black;" html-type="submit" block>
                    Đăng Ký Ngay
                </a-button>
                <div class="login-option">
                    <span>Đã có tài khoản?</span>
                    <nuxt-link to="/login">Đăng Nhập Ngay</nuxt-link>
                </div>
            </a-form>
        </div>
    </div>
</template>

<script setup lang="ts">

const router = useRouter();

const username = ref('');
const fullname = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const onSubmit = async () => {
    if (password.value !== confirmPassword.value) {
        message.error('Mật khẩu không khớp!');
        return;
    }

    try {
        const payload = {
            username: username.value,
            fullname: fullname.value,
            email: email.value,
            password: password.value,
        };

        console.log('Payload:', payload); // Kiểm tra giá trị input

        const response = await $fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            body: payload,
        });

        message.success('Đăng ký thành công!');
        router.push('/login'); // Điều hướng sang trang đăng nhập
    } catch (error) {
        message.error('Đăng ký thất bại! Vui lòng thử lại.');
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