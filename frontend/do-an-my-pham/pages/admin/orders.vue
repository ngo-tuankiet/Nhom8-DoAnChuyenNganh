<template>
    <div>
        <a-tabs v-model:activeKey="activeTab" @change="fetchOrders">
            <a-tab-pane key="1" tab="Chờ xác nhận"></a-tab-pane>
            <a-tab-pane key="2" tab="Đã xác nhận"></a-tab-pane>
            <a-tab-pane key="3" tab="Đang giao"></a-tab-pane>
            <a-tab-pane key="4" tab="Hoàn thành"></a-tab-pane>
            <a-tab-pane key="5" tab="Đã hủy"></a-tab-pane>
        </a-tabs>

        <a-table :columns="columns" :data-source="orders" rowKey="id">
            <template #total_items="{ text }">
                <span>{{ formatPrice(text) }}</span>
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
                    style="color:green;background-color: #fff;margin-right: 10px;" size="small"
                    @click="showModalConfirm(record.id)">
                    <template #icon>
                        <CheckCircleOutlined />
                    </template>
                </a-button>
                <a-button v-if="record.status === 'Đã xác nhận'" type="primary"
                    style="color:green;background-color: #fff;margin-right: 10px;" size="small"
                    @click="showModalDelivery(record.id)">
                    <template #icon>
                        <CheckCircleOutlined />
                    </template>
                </a-button>
                <a-button v-if="record.status === 'Chờ xác nhận'" type="primary"
                    style="color:red;background-color: #fff;" size="small" @click="showModalCancel(record.id)">
                    <template #icon>
                        <CloseCircleOutlined />
                    </template>
                </a-button>
                <a-button v-if="record.status === 'Đang giao hàng'" type="primary"
                    style="color:red;background-color: #fff;" size="small" @click="showModalDone(record.id)">
                    <template #icon>
                        <CloseCircleOutlined />
                    </template>
                </a-button>
            </template>
        </a-table>

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
        <a-modal :visible="modalVisibleCancel" title="Xác nhận hủy đơn hàng" width="800px" @cancel="handleCancel"
            @ok="cancelOrder">
            <div>Bạn có chắc muốn hủy đơn hàng này không?</div>
        </a-modal>
        <a-modal :visible="modalVisibleConfirm" title="Xác nhận nhận đơn hàng" width="800px" @cancel="handleCancel"
            @ok="confirmOrder">
            <div>Bạn có chắc muốn nhận đơn hàng này không?</div>
        </a-modal>
        <a-modal :visible="modalVisibleDelivery" title="Xác nhận bàn giao đơn vị vận chuyển" width="800px"
            @cancel="handleCancel" @ok="deliveryOrder">
            <div>Đơn hàng đã được bàn giao cho đơn vị vận chuyển?</div>
        </a-modal>
        <a-modal :visible="modalVisibleDone" title="Đơn hàng đã được giao thành công" width="800px"
            @cancel="handleCancel" @ok="doneOrder">
            <div>Đơn hàng đã được bàn giao cho đơn vị vận chuyển?</div>
        </a-modal>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';

definePageMeta({
    layout: 'admin',
    keepalive: false
});

const activeTab = ref('1');
const orders = ref([]);
const loading = ref(true);
const modalVisible = ref(false);
const orderDetail = ref(null);
const modalVisibleCancel = ref(false);
const idCancel = ref(null);
const modalVisibleConfirm = ref(false);
const idConfirm = ref(null);
const modalVisibleDelivery = ref(false);
const idDelivery = ref(null);
const modalVisibleDone = ref(false);
const idDone = ref(null);
const columns = [
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
        width: 150,
        slots: { customRender: 'action' }
    }
]
const detailColumns = [
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
]
// Hàm lấy danh sách đơn hàng theo trạng thái
const fetchOrders = async () => {
    loading.value = true;
    const status = activeTab.value;

    try {
        const response = await fetch(`http://localhost:5000/api/order/list/${status}`);
        const data = await response.json();

        if (data.success) {
            const dataConvert = data.data.map((item) => {
                return {
                    ...item,
                    total_amount: formatPrice(item.total_amount),
                    created_at: formatDate(item.created_at),
                    status: getFormatStatus(item.status)
                }
            })
            orders.value = dataConvert;
        } else {
            message.error(data.message || 'Lỗi khi tải danh sách đơn hàng');
        }
    } catch (error) {
        console.error('Error:', error);
        message.error('Có lỗi xảy ra khi tải danh sách đơn hàng');
    } finally {
        loading.value = false;
    }
};

// Hiển thị chi tiết đơn hàng
const showOrderDetail = async (orderId) => {
    try {
        const response = await fetch(`http://localhost:5000/api/order/detail/${orderId}`);
        const data = await response.json();

        if (data.success) {
            orderDetail.value = data.data;
            modalVisible.value = true;
        } else {    
            message.error(data.message || 'Không thể lấy chi tiết đơn hàng');
        }
    } catch (error) {
        console.error('Error:', error);
        message.error('Có lỗi xảy ra khi tải chi tiết đơn hàng');
    }
};
const showModalCancel = (id) => {
    modalVisibleCancel.value = true
    idCancel.value = id;
}
const showModalConfirm = (id) => {
    modalVisibleConfirm.value = true
    idConfirm.value = id;
}
const showModalDelivery = (id) => {
    modalVisibleDelivery.value = true
    idDelivery.value = id;
}
const showModalDone = (id) => {
    modalVisibleDone.value = true
    idDone.value = id;
}
// Hủy đơn hàng
const cancelOrder = async () => {
    try {
        const response = await fetch(`http://localhost:5000/api/order/status/${idCancel.value}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 5 })
        });

        if (response.ok) {
            fetchOrders();
            modalVisibleCancel.value = false;
            message.success('Hủy đơn hàng thành công');
            fetchOrders(); // Tải lại danh sách đơn hàng
        } else {
            const { message } = await response.json();
            message.error(message || 'Có lỗi xảy ra khi hủy đơn hàng');
        }
    } catch (error) {
        message.error('Có lỗi xảy ra khi hủy đơn hàng');
        console.error(error);
    }
};
const confirmOrder = async () => {
    try {
        const response = await fetch(`http://localhost:5000/api/order/status/${idConfirm.value}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 2 })
        });

        if (response.ok) {
            fetchOrders();
            modalVisibleCancel.value = false;
            message.success('Xác nhận đơn hàng thành công');
            fetchOrders(); // Tải lại danh sách đơn hàng
            handleCancel()
        } else {
            const { message } = await response.json();
            message.error(message || 'Có lỗi xảy ra khi xác nhận đơn hàng');
        }
    } catch (error) {
        message.error('Có lỗi xảy ra khi xác nhận đơn hàng');
        console.error(error);
    }
};
const deliveryOrder = async () => {
    try {
        const response = await fetch(`http://localhost:5000/api/order/status/${idDelivery.value}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 3 })
        });

        if (response.ok) {
            fetchOrders();
            modalVisibleCancel.value = false;
            message.success('Đơn hàng đã bàn giao đơn vị vận chuyển thành công');
            fetchOrders(); // Tải lại danh sách đơn hàng
            handleCancel()
        } else {
            const { message } = await response.json();
            message.error(message || 'Có lỗi xảy ra khi bàn giao đơn vị vận chuyển');
        }
    } catch (error) {
        message.error('Có lỗi xảy ra khi bàn giao đơn vị vận chuyển');
        console.error(error);
    }
};
const doneOrder = async () => {
    try {
        const response = await fetch(`http://localhost:5000/api/order/status/${idDelivery.value}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 4 })
        });

        if (response.ok) {
            fetchOrders();
            modalVisibleCancel.value = false;
            message.success('Đơn hàng đã được giao thành công');
            fetchOrders(); // Tải lại danh sách đơn hàng
            handleCancel()
        } else {
            const { message } = await response.json();
            message.error(message || 'Có lỗi xảy ra khi giao thành công');
        }
    } catch (error) {
        message.error('Có lỗi xảy ra khi giao thành công');
        console.error(error);
    }
};
const handleCancel = () => {
    modalVisible.value = false;
    modalVisibleCancel.value = false;
    modalVisibleConfirm.value = false;
    orderDetail.value = null;
    modalVisibleDelivery.value = false;
    modalVisibleDone.value = false;
};

// Chuyển đổi trạng thái sang tên dễ hiểu
const getStatusText = (status) => {
    const statusMap = {
        1: 'Chờ xác nhận',
        2: 'Chờ xử lý',
        3: 'Đang giao',
        4: 'Hoàn thành',
        5: 'Đã hủy'
    };
    return statusMap[status] || 'Không xác định';
};
const formatDate = (date) => {
    return new Date(date).toLocaleString('vi-VN');
}

const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}
const getFormatStatus = (status) => {
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
// const showModalCancel = (id) => {
//     this.modalVisibleCancel = true
//     this.idCancel = id;
// }
// Chuyển đổi trạng thái sang màu sắc cho tag
const getStatusColor = (status) => {
    const colorMap = {
        1: 'orange',
        2: 'blue',
        3: 'cyan',
        4: 'green',
        5: 'red'
    };
    return colorMap[status] || 'default';
};

// Gọi fetchOrders khi component được mount
onMounted(() => {
    fetchOrders();
});
</script>

<style scoped>
.ant-table-wrapper {
    margin-top: 20px;
}
</style>
