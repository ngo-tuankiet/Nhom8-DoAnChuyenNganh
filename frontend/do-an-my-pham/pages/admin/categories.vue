<!-- pages/admin/category.vue -->
<template>
    <div>
        <a-card title="Quản lý loại sản phẩm">
            <template #extra>
                <a-button type="primary" @click="showModal">
                    Thêm loại sản phẩm
                </a-button>
            </template>

            <!-- Table hiển thị danh sách loại sản phẩm -->
            <a-table :dataSource="categories" :columns="columns">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a-button type="primary" @click="handleEdit(record)">
                                Sửa
                            </a-button>
                            <a-popconfirm title="Bạn có chắc chắn muốn xóa?" @confirm="handleDelete(record.id)">
                                <a-button type="primary" danger>Xóa</a-button>
                            </a-popconfirm>
                        </a-space>
                    </template>
                </template>
            </a-table>

            <!-- Modal thêm/sửa loại sản phẩm -->
            <a-modal :title="modalTitle" v-model:visible="visible" @ok="handleOk" @cancel="handleCancel"
                :confirmLoading="confirmLoading" :destroyOnClose="true">
                <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
                    <a-form-item label="Tên loại sản phẩm" name="name">
                        <a-input v-model:value="formState.name" />
                    </a-form-item>

                    <a-form-item label="Mô tả" name="description">
                        <a-textarea v-model:value="formState.description" :rows="4" />
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
const categories = ref([])
const modalTitle = ref('Thêm loại sản phẩm')
const formRef = ref(null)
const currentId = ref(null)
const controller = new AbortController()
const signal = controller.signal

// Initial form state
const initialFormState = {
    name: '',
    description: ''
}

// Form state
const formState = reactive({ ...initialFormState })

// Table columns
const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Tên loại sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    { title: 'Thao tác', key: 'action' }
]

// Form rules
const rules = {
    name: [
        { required: true, message: 'Vui lòng nhập tên loại sản phẩm' },
        { min: 2, message: 'Tên loại sản phẩm phải có ít nhất 2 ký tự' }
    ],
    description: [
        { required: true, message: 'Vui lòng nhập mô tả' }
    ]
}

// Methods
const showModal = () => {
    visible.value = true
    modalTitle.value = 'Thêm loại sản phẩm'
    currentId.value = null
    resetForm()
}

const handleOk = () => {
    formRef.value?.validate().then(() => {
        confirmLoading.value = true

        const url = currentId.value
            ? `http://localhost:5000/api/categories/categories/${currentId.value}`
            : 'http://localhost:5000/api/categories/categories'
        const method = currentId.value ? 'PUT' : 'POST'

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
                message.success(`Loại sản phẩm đã được ${currentId.value ? 'cập nhật' : 'thêm'} thành công`)
                visible.value = false
                confirmLoading.value = false
                fetchCategories()
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
    modalTitle.value = 'Sửa loại sản phẩm'
    Object.assign(formState, record)
    visible.value = true
}

const handleDelete = async (id) => {
    try {
        await fetch(`http://localhost:5000/api/categories/categories/${id}`, {
            method: 'DELETE',
            signal
        })
        message.success('Xóa loại sản phẩm thành công')
        fetchCategories()
    } catch (error) {
        if (error.name === 'AbortError') return
        message.error('Có lỗi xảy ra khi xóa loại sản phẩm')
    }
}

const resetForm = () => {
    Object.assign(formState, initialFormState)
    formRef.value?.resetFields()
}

const fetchCategories = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/categories/categories', { signal })
        categories.value = await response.json()
    } catch (error) {
        if (error.name === 'AbortError') return
        message.error('Có lỗi xảy ra khi tải danh sách loại sản phẩm')
    }
}

// Lifecycle hooks
onMounted(() => {
    fetchCategories()
})

onBeforeUnmount(() => {
    visible.value = false
    confirmLoading.value = false
    controller.abort()
    categories.value = []
})

// Router guard
router.beforeEach((to, from, next) => {
    visible.value = false
    next()
})
</script>
<style scoped></style>