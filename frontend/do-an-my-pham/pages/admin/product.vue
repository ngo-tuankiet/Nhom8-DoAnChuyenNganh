<!-- pages/admin/product.vue -->
<template>
    <div>
        <a-card title="Quản lý sản phẩm">
            <template #extra>
                <a-button type="primary" @click="showModal">
                    Thêm sản phẩm
                </a-button>
            </template>

            <!-- Table hiển thị danh sách sản phẩm -->
            <a-table :dataSource="products" :columns="columns">
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
                    <template v-if="column.key === 'images'">
                        <div style="display: flex; flex-wrap: wrap;">
                            <a-image v-for="(image, index) in record.images" :key="index" :width="50" :src="image"
                                style="margin-right: 5px; margin-bottom: 5px;" />
                        </div>
                    </template>
                </template>
            </a-table>


            <!-- Modal thêm/sửa sản phẩm -->
            <a-modal :title="modalTitle" v-model:visible="visible" @ok="handleOk" @cancel="handleCancel"
                :confirmLoading="confirmLoading" :destroyOnClose="true">
                <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
                    <a-form-item label="Tên sản phẩm" name="name">
                        <a-input v-model:value="formState.name" />
                    </a-form-item>
                    <a-form-item label="Mô tả" name="description">
                        <a-textarea v-model:value="formState.description" />
                    </a-form-item>
                    <a-form-item label="Giá" name="price">
                        <a-input-number v-model:value="formState.price" :min="0" />
                    </a-form-item>
                    <a-form-item label="Số lượng" name="stock">
                        <a-input-number v-model:value="formState.stock" :min="0" />
                    </a-form-item>
                    <a-form-item label="Thương hiệu" name="brand_id">
                        <a-select v-model:value="formState.brand_id">
                            <a-select-option v-for="brand in brands" :key="brand.id" :value="brand.id">
                                {{ brand.brand_name }}
                            </a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item label="Danh mục" name="subcategory_id">
                        <a-select v-model:value="formState.subcategory_id">
                            <a-select-option v-for="category in categories" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item label="Hình ảnh" name="images">
                        <a-upload list-type="picture-card" :file-list="fileList" @preview="handlePreview"
                            @change="handleChange" :before-upload="beforeUpload" multiple>
                            <div v-if="fileList.length < 10">
                                <plus-outlined />
                                <div style="margin-top: 8px">Upload</div>
                            </div>
                        </a-upload>
                    </a-form-item>
                </a-form>
            </a-modal>

            <!-- Modal xem trước ảnh -->
            <a-modal v-model:visible="previewVisible" :title="previewTitle" :footer="null">
                <img :src="previewImage" style="width: 100%" />
            </a-modal>
        </a-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

definePageMeta({
    layout: 'admin',
    keepalive: false
})

// State
const visible = ref(false)
const confirmLoading = ref(false)
const products = ref([])
const brands = ref([])
const categories = ref([])
const fileList = ref([])
const previewVisible = ref(false)
const previewImage = ref('')
const previewTitle = ref('')
const modalTitle = ref('Thêm sản phẩm')
const formRef = ref(null)
const currentId = ref(null)
const controller = new AbortController()
const signal = controller.signal

// Initial form state
const initialFormState = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    brand_id: undefined,
    subcategory_id: undefined
}

// Form state
const formState = reactive({ ...initialFormState })

// Table columns
const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Giá', dataIndex: 'price', key: 'price' },
    { title: 'Số lượng', dataIndex: 'stock', key: 'stock' },
    { title: 'Hình ảnh', key: 'images' },
    { title: 'Thao tác', key: 'action' }
]

// Form rules
const rules = {
    name: [{ required: true, message: 'Vui lòng nhập tên sản phẩm' }],
    price: [{ required: true, message: 'Vui lòng nhập giá' }],
    stock: [{ required: true, message: 'Vui lòng nhập số lượng' }],
    brand_id: [{ required: true, message: 'Vui lòng chọn thương hiệu' }],
    subcategory_id: [{ required: true, message: 'Vui lòng chọn danh mục' }]
}

// Methods
const showModal = () => {
    visible.value = true
    modalTitle.value = 'Thêm sản phẩm'
    currentId.value = null
    resetForm()
}

const handleOk = () => {
    formRef.value?.validate().then(() => {
        confirmLoading.value = true

        const formData = new FormData()
        Object.keys(formState).forEach(key => formData.append(key, formState[key]))

        fileList.value.forEach(file => {
            if (file.originFileObj) formData.append('images', file.originFileObj)
        })

        const url = currentId.value ? `http://localhost:5000/api/products/update/${currentId.value}` : 'http://localhost:5000/api/products/create'
        const method = currentId.value ? 'PUT' : 'POST'

        fetch(url, { method, body: formData, signal })
            .then(response => response.json())
            .then(() => {
                message.success(`Sản phẩm đã được ${currentId.value ? 'cập nhật' : 'thêm'} thành công`)
                visible.value = false
                confirmLoading.value = false
                fetchProducts()
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
    modalTitle.value = 'Sửa sản phẩm'
    Object.assign(formState, record)
    fileList.value = record.images.map((url, index) => ({
        uid: `-${index}`, name: `image-${index}`, status: 'done', url
    }))
    console.log(fileList.value)
    visible.value = true
}

const handleDelete = async (id) => {
    try {
        await fetch(`http://localhost:5000/api/products/delete/${id}`, { method: 'DELETE', signal })
        message.success('Xóa sản phẩm thành công')
        fetchProducts()
    } catch (error) {
        if (error.name === 'AbortError') return
        message.error('Có lỗi xảy ra khi xóa sản phẩm')
    }
}

const handlePreview = async (file) => {
    previewImage.value = file.url || file.preview
    previewVisible.value = true
    previewTitle.value = file.name || file.url.substring(file.url.lastIndexOf('/') + 1)
}

const handleChange = ({ fileList: newFileList }) => {
    fileList.value = newFileList
}

const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) message.error('Bạn chỉ có thể tải lên file ảnh!')
    return false
}

const cleanupUpload = () => {
    fileList.value.forEach(file => {
        if (file.url && file.url.startsWith('blob:')) URL.revokeObjectURL(file.url)
    })
    fileList.value = []
}

const resetForm = () => {
    Object.assign(formState, initialFormState)
    cleanupUpload()
    formRef.value?.resetFields()
}

const fetchProducts = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/products/list', { signal })
        products.value = await response.json()
    } catch (error) {
        if (error.name === 'AbortError') return
        message.error('Có lỗi xảy ra khi tải danh sách sản phẩm')
    }
}

const fetchBrands = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/products/brands', { signal })
        brands.value = await response.json()
    } catch (error) {
        if (error.name === 'AbortError') return
        message.error('Có lỗi xảy ra khi tải danh sách thương hiệu')
    }
}

const fetchCategories = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/products/listcategories', { signal })
        categories.value = await response.json()
    } catch (error) {
        if (error.name === 'AbortError') return
        message.error('Có lỗi xảy ra khi tải danh mục sản phẩm')
    }
}

// Lifecycle hooks
onMounted(() => {
    fetchProducts()
    fetchBrands()
    fetchCategories()
})

onBeforeUnmount(() => {
    visible.value = false
    previewVisible.value = false
    confirmLoading.value = false
    controller.abort()
    cleanupUpload()
    products.value = []
    brands.value = []
    categories.value = []
})

// Router guard để dọn dẹp khi chuyển trang
router.beforeEach((to, from, next) => {
    visible.value = false
    previewVisible.value = false
    next()
})
</script>
