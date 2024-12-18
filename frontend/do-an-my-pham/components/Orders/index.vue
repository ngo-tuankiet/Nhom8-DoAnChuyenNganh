<template>
    <div>
        <a-table :columns="columns" :data-source="orders" :loading="loading" rowKey="id">
            <template #total_items="{ text }">
                <span>{{ text }}</span>
            </template>
            <template #status="{ text }">
                <span>{{ getFormatStatus(text) }}</span>
            </template>
            <!-- Template cho cột thao tác -->
            <template #action="{ record }">
                <a-button type="primary" style="margin-right: 10px;background-color: #fff;color:black" size="small"
                    @click="showOrderDetail(record.id)">
                    <template #icon>
                        <EyeOutlined />
                    </template>
                </a-button>
                <a-button v-if="record.status === 'Chờ xác nhận'" type="primary"
                    style="color:red;background-color: #fff;" size="small" @click="showModalCancel(record.id)">
                    <template #icon>
                        <CloseCircleOutlined />
                    </template>
                </a-button>
            </template>
        </a-table>

        <!-- Modal chi tiết đơn hàng -->
        <a-modal :visible="modalVisible" title="Chi tiết đơn hàng" width="800px" @cancel="handleCancel" :footer="null">
            <div v-if="orderDetail">
                <div class="order-info">
                    <h3>Thông tin đơn hàng #{{ orderDetail.code }}</h3>
                    <a-descriptions :column="2">
                        <a-descriptions-item label="Ngày đặt">
                            {{ formatDate(orderDetail.created_at) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="Trạng thái">
                            <a-tag :color="getStatusColor(orderDetail.status)">
                                {{ getFormatStatus(orderDetail.status) }}
                            </a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="Tên khách hàng">
                            {{ orderDetail.customer_name }}
                        </a-descriptions-item>
                        <a-descriptions-item label="Số điện thoại">
                            {{ orderDetail.customer_phone }}
                        </a-descriptions-item>
                        <a-descriptions-item label="Địa chỉ">
                            {{ orderDetail.customer_address }}
                        </a-descriptions-item>
                        <a-descriptions-item label="Ghi chú" v-if="orderDetail.note">
                            {{ orderDetail.note }}
                        </a-descriptions-item>
                    </a-descriptions>
                </div>

                <div class="order-items mt-4">
                    <h3>Chi tiết sản phẩm</h3>
                    <a-table :columns="detailColumns" :data-source="orderDetail.items" :pagination="false"
                        rowKey="product_id">
                        <template #image="{ text }">
                            <img :src="text[0]" alt="product" style="width: 50px; height: 50px; object-fit: cover;" />
                        </template>
                        <template #price="{ text }">
                            {{ formatPrice(text) }}
                        </template>
                        <template #totalPrice="{ record }">
                            {{ formatPrice(record.price * record.quantity) }}
                        </template>
                    </a-table>

                    <div class="total-amount mt-4 text-right">
                        <h3>Tổng tiền: {{ formatPrice(orderDetail.total_amount) }}</h3>
                    </div>
                </div>
            </div>
        </a-modal>
        <a-modal :visible="modalVisibleCancel" title="Xác nhận hủy đơn hàng" width="800px" @cancel="handleCancelOrder"
            @ok="cancelOrder">
            <div>Bạn có chắc muốn hủy đơn hàng này không?</div>
        </a-modal>
    </div>
</template>

<script>
import { message } from 'ant-design-vue';
import { EyeOutlined, CloseCircleOutlined } from '@ant-design/icons-vue';

export default {
    components: {
        EyeOutlined, CloseCircleOutlined
    },
    data() {
        return {
            orders: [],
            loading: true,
            modalVisible: false,
            orderDetail: null,
            modalVisibleCancel: false,
            idCancel: null,
            columns: [
                {
                    title: 'STT',
                    dataIndex: 'id',
                    key: 'id',
                },
                {
                    title: 'Ngày đặt',
                    dataIndex: 'created_at',
                    key: 'created_at',
                },
                {
                    title: 'Số lượng sản phẩm',
                    dataIndex: 'total_items',
                    key: 'total_items',
                },
                {
                    title: 'Tổng tiền',
                    dataIndex: 'total_amount',
                    key: 'total_amount',
                },
                {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => "this.getFormatStatus(status)",
                },
                {
                    title: 'Thao tác',
                    key: 'action',
                    fixed: 'right',
                    width: 100,
                    slots: { customRender: 'action' }
                }
            ],
            detailColumns: [
                {
                    title: 'Hình ảnh',
                    dataIndex: 'images',
                    key: 'images',
                    width: 80,
                    slots: { customRender: 'image' }
                },
                {
                    title: 'Tên sản phẩm',
                    dataIndex: 'product_name',
                    key: 'product_name',
                },
                {
                    title: 'Số lượng',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 100,
                },
                {
                    title: 'Đơn giá',
                    dataIndex: 'price',
                    key: 'price',
                    width: 150,
                    slots: { customRender: 'price' }
                },
                {
                    title: 'Thành tiền',
                    key: 'totalPrice',
                    width: 150,
                    slots: { customRender: 'totalPrice' }
                }
            ],
        };
    },
    mounted() {
        this.fetchOrders();
    },
    methods: {
        async fetchOrders() {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const userId = user?.id;

            if (!userId) {
                message.error('Không tìm thấy thông tin người dùng.');
                this.loading = false;
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/api/order/listorder/${userId}`);
                const data = await response.json();

                // Kiểm tra dữ liệu trả về
                if (Array.isArray(data)) {
                    this.orders = data;
                } else if (data.data && Array.isArray(data.data)) {
                    const dataConvert = data.data.map((item) => {
                        return {
                            ...item,
                            total_amount: this.formatPrice(item.total_amount),
                            created_at: this.formatDate(item.created_at),
                            status: this.getFormatStatus(item.status)
                        }
                    })
                    console.log(dataConvert);
                    this.orders = dataConvert;
                } else {
                    this.orders = [];
                    message.error('Định dạng dữ liệu không hợp lệ');
                }
                console.log("Orders:", this.orders);
            } catch (error) {
                console.error('Error:', error);
                message.error('Có lỗi xảy ra khi tải danh sách đơn hàng');
                this.orders = [];
            } finally {
                this.loading = false;
            }
        },

        async showOrderDetail(orderId) {
            try {
                const response = await fetch(`http://localhost:5000/api/order/detail/${orderId}`);
                const result = await response.json();

                if (result.success) {
                    this.orderDetail = result.data;
                    this.modalVisible = true;
                } else {
                    message.error(result.message || 'Không thể lấy chi tiết đơn hàng');
                }
            } catch (error) {
                console.error('Error:', error);
                message.error('Có lỗi xảy ra khi tải chi tiết đơn hàng');
            }
        },

        handleCancel() {
            this.modalVisible = false;
            this.orderDetail = null;
        },

        formatDate(date) {
            return new Date(date).toLocaleString('vi-VN');
        },

        formatPrice(price) {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(price);
        },
        showModalCancel(id) {
            this.modalVisibleCancel = true
            this.idCancel = id;
        },
        async cancelOrder() {
            try {
                const response = await fetch(`http://localhost:5000/api/order/status/${this.idCancel}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 5 })
                });

                if (response.ok) {
                    this.fetchOrders();
                    this.modalVisibleCancel = false;
                    this.$message.success('Hủy đơn hàng thành công');
                    this.fetchOrders(); // Tải lại danh sách đơn hàng
                } else {
                    const { message } = await response.json();
                    this.$message.error(message || 'Có lỗi xảy ra khi hủy đơn hàng');
                }
            } catch (error) {
                this.$message.error('Có lỗi xảy ra khi hủy đơn hàng');
                console.error(error);
            }
        },
        getStatusColor(status) {
            switch (status) {
                case 1:
                    return "orange";
                case 5:
                    return "red";
                default:
                    return "blue"
            }
            // const statusColors = {
            //     'pending': 'orange',
            //     'processing': 'blue',
            //     'completed': 'green',
            //     'cancelled': 'red'
            // };
        },

        getFormatStatus(status) {
            switch (status) {
                case 1:
                    return "Chờ xác nhận";
                case 2:
                    return "Đã xác nhận";
                case 3:
                    return "Đang giao hàng";
                case 4:
                    return "Đã nhận hàng";
                case 5:
                    return "Đã hủy đơn";
                default:
                    return "Chờ xác nhận"
            }
         
        }
    }
};
</script>

<style scoped>
.mt-4 {
    margin-top: 1rem;
}

.text-right {
    text-align: right;
}

.order-info {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #f0f0f0;
}

.order-items {
    margin-top: 1.5rem;
}

:deep(.ant-descriptions-item-label) {
    font-weight: bold;
}
</style>