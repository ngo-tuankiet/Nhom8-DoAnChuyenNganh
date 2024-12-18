<!-- pages/cart.vue -->
<template>
    <div class="container mx-auto p-4">
        <a-card title="Giỏ hàng của bạn">
            <!-- Bảng hiển thị sản phẩm trong giỏ hàng -->
            <a-table v-if="cartItems.length" :dataSource="cartItems" :columns="columns" :pagination="false">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'image'">
                        <a-image :src="record.images[0].url" :width="80" />
                    </template>
                    <template v-if="column.key === 'quantity'">
                        <a-input-number v-model:value="record.quantity" :min="1"
                            @change="(value) => updateQuantity(record, value)" />
                    </template>
                    <template v-if="column.key === 'total'">
                        {{ formatPrice(record.price * record.quantity) }}
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-button type="primary" danger @click="removeFromCart(record)">
                            Xóa
                        </a-button>
                    </template>
                </template>
            </a-table>

            <div v-else class="text-center py-8">
                <h3>Giỏ hàng trống</h3>
                <NuxtLink to="/">
                    <a-button type="primary">Tiếp tục mua sắm</a-button>
                </NuxtLink>
            </div>

            <!-- Tổng tiền -->
            <div v-if="cartItems.length" class="text-right mt-4">
                <h2>Tổng tiền: {{ formatPrice(totalAmount) }}</h2>
            </div>

            <!-- Form thông tin giao hàng -->
            <div v-if="cartItems.length" class="mt-8">
                <h2 class="mb-4">Thông tin giao hàng</h2>
                <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical" @finish="handleSubmit">
                    <a-form-item label="Họ và tên" name="fullName">
                        <a-input v-model:value="formState.fullName" />
                    </a-form-item>

                    <a-form-item label="Số điện thoại" name="phone">
                        <a-input v-model:value="formState.phone" />
                    </a-form-item>

                    <a-form-item label="Địa chỉ" name="address">
                        <a-textarea v-model:value="formState.address" :rows="4" />
                    </a-form-item>

                    <a-form-item label="Ghi chú" name="note">
                        <a-textarea v-model:value="formState.note" :rows="4" />
                    </a-form-item>

                    <a-form-item>
                        <a-button type="primary" html-type="submit" :loading="submitting">
                            Đặt hàng
                        </a-button>
                    </a-form-item>
                </a-form>
            </div>
        </a-card>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'

// State
const cartItems = ref([])
const submitting = ref(false)
const formRef = ref(null)

// Form state
const formState = ref({
    fullName: '',
    phone: '',
    address: '',
    note: ''
})

// Validation rules
const rules = {
    fullName: [{ required: true, message: 'Vui lòng nhập họ tên' }],
    phone: [
        { required: true, message: 'Vui lòng nhập số điện thoại' },
        { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' }
    ],
    address: [{ required: true, message: 'Vui lòng nhập địa chỉ' }]
}

// Table columns
const columns = [
    { title: 'Hình ảnh', key: 'image', width: 100 },
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Đơn giá', dataIndex: 'price', key: 'price' },
    { title: 'Số lượng', key: 'quantity', width: 120 },
    { title: 'Thành tiền', key: 'total' },
    { title: 'Thao tác', key: 'action', width: 100 }
]

// Computed
const totalAmount = computed(() => {
    return cartItems.value.reduce((total, item) => {
        return total + (item.price * item.quantity)
    }, 0)
})

// Methods
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price)
}

const loadCartFromSession = () => {
    const cart = sessionStorage.getItem('cart')
    if (cart) {
        cartItems.value = JSON.parse(cart)
    }
}

const updateQuantity = (item, value) => {
    item.quantity = value
    saveCartToSession()
}

const removeFromCart = (item) => {
    const index = cartItems.value.findIndex(i => i.id === item.id)
    if (index > -1) {
        cartItems.value.splice(index, 1)
        saveCartToSession()
        message.success('Đã xóa sản phẩm khỏi giỏ hàng')
    }
}

const saveCartToSession = () => {
    sessionStorage.setItem('cart', JSON.stringify(cartItems.value))
}

const handleSubmit = async (values) => {
    submitting.value = true
    try {
        // Lấy thông tin user từ session nếu có
        const user = JSON.parse(sessionStorage.getItem('user'));

        const order = {
            items: cartItems.value.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            customer: {
                ...values,
                userId: user ? user.id : null
            },
            totalAmount: totalAmount.value
        };

        const response = await fetch('http://localhost:5000/api/order/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        // Xóa giỏ hàng sau khi đặt hàng thành công
        sessionStorage.removeItem('cart');
        cartItems.value = [];

        message.success(`Đặt hàng thành công! Mã đơn hàng của bạn là: ${result.data.orderCode}`);

        // Chuyển hướng về trang chủ
        window.location.href = '/';
    } catch (error) {
        message.error(error.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
        submitting.value = false;
    }
};


// Mounted hook
onMounted(() => {
    loadCartFromSession()
})
</script>
<style>
/* Thêm styles nếu cần */
</style>