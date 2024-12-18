<template>
    <div>
        <a-card class="w-full max-w-md">
            <a-card-header>
                <a-card-title>Change Password</a-card-title>
            </a-card-header>
            <a-card-content>
                <div class="space-y-4">
                    <a-label>Mật khẩu cũ</a-label>
                    <a-input label="Old Password" type="password" v-model:value="oldPassword" />
                    <a-label>Mật khẩu mới</a-label>
                    <a-input label="New Password" type="password" v-model:value="newPassword" />
                    <a-label>Xác nhận mật khẩu</a-label>
                    <a-input label="Confirm Password" type="password" v-model:value="confirmPassword" />
                    <a-button @click="handlePasswordChange">Update Password</a-button>
                </div>
            </a-card-content>
        </a-card>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    data() {
        return {
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        }
    },
    methods: {
        async handlePasswordChange() {
            try {
                const user = JSON.parse(sessionStorage.getItem('user'));
                await axios.post(`http://localhost:5000/api/users/password-change`, {
                    oldPassword: this.oldPassword,
                    newPassword: this.newPassword,
                    confirmPassword: this.confirmPassword,
                    id: user.id
                })
                this.oldPassword = "";
                this.newPassword = "";
                this.confirmPassword = "";
                message.success('Cập nhập mật khẩu thành công')
            } catch (error) {
                message.error('Đã có lỗi xảy ra')
            }
        }
    }
}
</script>