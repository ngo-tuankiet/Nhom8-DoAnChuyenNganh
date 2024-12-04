<!-- pages/admin/user.vue -->
<template>
    <div>
        <a-card title="Quản lý tài khoản">
            <template #extra>
                <a-button type="primary" @click="showModal">
                    Thêm tài khoản
                </a-button>
            </template>

            <!-- Table hiển thị danh sách tài khoản -->
            <a-table :dataSource="users" :columns="columns">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a-button type="primary" @click="handleEdit(record)">
                                Sửa
                            </a-button>
                            <a-popconfirm title="Bạn có chắc chắn muốn xóa?" @confirm="handleDelete(record.id)"
                                v-if="record.role !== 2">
                                <a-button type="primary" danger>Xóa</a-button>
                            </a-popconfirm>
                        </a-space>
                    </template>
                    <template v-if="column.key === 'role'">
                        <a-tag :color="record.role === 2 ? 'red' : 'blue'">
                            {{ record.role === 2 ? 'Admin' : 'User' }}
                        </a-tag>
                    </template>
                </template>
            </a-table>

            <!-- Modal thêm/sửa tài khoản -->
            <a-modal :title="modalTitle" v-model:visible="visible" @ok="handleOk" @cancel="handleCancel"
                :confirmLoading="confirmLoading" :destroyOnClose="true">
                <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
                    <a-form-item label="Tên đăng nhập" name="username">
                        <a-input v-model:value="formState.username" :disabled="!!currentId" />
                    </a-form-item>

                    <a-form-item label="Email" name="email">
                        <a-input v-model:value="formState.email" />
                    </a-form-item>

                    <!-- <a-form-item label="Mật khẩu" name="password" :required="!currentId">
                        <a-input-password v-model:value="formState.password" placeholder={currentId
                            ? "Để trống nếu không thay đổi mật khẩu" : "" } />
                    </a-form-item> -->

                    <a-form-item label="Họ và tên" name="fullname">
                        <a-input v-model:value="formState.fullname" />
                    </a-form-item>

                    <a-form-item label="Vai trò" name="role">
                        <a-select v-model:value="formState.role">
                            <a-select-option :value="1">User</a-select-option>
                            <a-select-option :value="2">Admin</a-select-option>
                        </a-select>
                    </a-form-item>
                </a-form>
            </a-modal>
        </a-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

definePageMeta({
    layout: 'admin',
    keepalive: false
})

// State
const visible = ref(false)
const confirmLoading = ref(false)
const users = ref([])
const modalTitle = ref('Thêm tài khoản')
const formRef = ref(null)
const currentId = ref(null)
const controller = new AbortController()
const signal = controller.signal

// Initial form state
const initialFormState = {
    username: '',
    email: '',
    password: '',
    fullname: '',
    role: 1
}

// Form state
const formState = reactive({ ...initialFormState })

// Table columns
const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Họ và tên', dataIndex: 'fullname', key: 'fullname' },
    { title: 'Vai trò', dataIndex: 'role', key: 'role' },
    { title: 'Thao tác', key: 'action' }
]

// Form rules
const rules = {
    username: [
        { required: true, message: 'Vui lòng nhập tên đăng nhập' },
        { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' }
    ],
    email: [
        { required: true, message: 'Vui lòng nhập email' },
        { type: 'email', message: 'Email không hợp lệ' }
    ],
    password: [
        { required: (formRef) => !currentId.value, message: 'Vui lòng nhập mật khẩu' },
        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
    ],
    fullname: [
        { required: true, message: 'Vui lòng nhập họ và tên' }
    ],
    role: [
        { required: true, message: 'Vui lòng chọn vai trò' }
    ]
}

// Methods
const showModal = () => {
    visible.value = true
    modalTitle.value = 'Thêm tài khoản'
    currentId.value = null
    resetForm()
}

const handleOk = () => {
    formRef.value?.validate().then(() => {
        confirmLoading.value = true

        const url = currentId.value
            ? `http://localhost:5000/api/users/user/${currentId.value}`
            : 'http://localhost:5000/api/users/user'
        const method = currentId.value ? 'PUT' : 'POST'

        // Nếu đang edit và không nhập mật khẩu mới thì xóa trường password
        if (currentId.value && !formState.password) {
            delete formState.password
        }

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formState),
            signal
        })
            .then(response => response.json())
            .then(() => {
                message.success(`Tài khoản đã được ${currentId.value ? 'cập nhật' : 'thêm'} thành công`)
                visible.value = false
                confirmLoading.value = false
                fetchUsers()
            })
            .catch(error => {
                if (error.name === 'AbortError') return
                message.error('Có lỗi xảy ra')
                confirmLoading.value = false
            })
    })
}

const handleCancel = () => {
    visible.value = false
    resetForm()
}

const handleEdit = (record) => {
    currentId.value = record.id
    modalTitle.value = 'Sửa tài khoản'
    Object.assign(formState, { ...record, password: '' }) // Không hiển thị mật khẩu cũ
    visible.value = true
}

const handleDelete = async (id) => {
    try {
        await fetch(`http://localhost:5000/api/users/users/${id}`, {
            method: 'DELETE',
            signal
        })
        message.success('Xóa tài khoản thành công')
        fetchUsers()
    } catch (error) {
        if (error.name === 'AbortError') return
        message.error('Có lỗi xảy ra khi xóa tài khoản')
    }
}

const resetForm = () => {
    Object.assign(formState, initialFormState)
    formRef.value?.resetFields()
}

const fetchUsers = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/users/users', { signal })
        users.value = await response.json()
    } catch (error) {
        if (error.name === 'AbortError') return
        message.error('Có lỗi xảy ra khi tải danh sách tài khoản')
    }
}

// Lifecycle hooks
onMounted(() => {
    fetchUsers()
})

onBeforeUnmount(() => {
    visible.value = false
    confirmLoading.value = false
    controller.abort()
    users.value = []
})

// Router guard
router.beforeEach((to, from, next) => {
    visible.value = false
    next()
})
</script>