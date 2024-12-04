<!-- pages/admin/brand.vue -->
<template>
  <div>
    <a-card title="Quản lý thương hiệu">
      <template #extra>
        <a-button type="primary" @click="showModal">
          Thêm thương hiệu
        </a-button>
      </template>

      <!-- Table hiển thị danh sách thương hiệu -->
      <a-table :dataSource="brands" :columns="columns">
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

      <!-- Modal thêm/sửa thương hiệu -->
      <a-modal :title="modalTitle" v-model:visible="visible" @ok="handleOk" @cancel="handleCancel"
        :confirmLoading="confirmLoading" :destroyOnClose="true">
        <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
          <a-form-item label="Tên thương hiệu" name="brand_name">
            <a-input v-model:value="formState.brand_name" />
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
const brands = ref([])
const modalTitle = ref('Thêm thương hiệu')
const formRef = ref(null)
const currentId = ref(null)
const controller = new AbortController()
const signal = controller.signal

// Initial form state
const initialFormState = {
  brand_name: ''
}

// Form state
const formState = reactive({ ...initialFormState })

// Table columns
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: 'Tên thương hiệu', dataIndex: 'brand_name', key: 'brand_name' },
  { title: 'Thao tác', key: 'action' }
]

// Form rules
const rules = {
  brand_name: [{ required: true, message: 'Vui lòng nhập tên thương hiệu' }]
}

// Methods
const showModal = () => {
  visible.value = true
  modalTitle.value = 'Thêm thương hiệu'
  currentId.value = null
  resetForm()
}

const handleOk = () => {
  formRef.value?.validate().then(() => {
    confirmLoading.value = true

    const url = currentId.value
      ? `http://localhost:5000/api/brands/brands/${currentId.value}`
      : 'http://localhost:5000/api/brands/brands'
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
        message.success(`Thương hiệu đã được ${currentId.value ? 'cập nhật' : 'thêm'} thành công`)
        visible.value = false
        confirmLoading.value = false
        fetchBrands()
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
  modalTitle.value = 'Sửa thương hiệu'
  Object.assign(formState, record)
  visible.value = true
}

const handleDelete = async (id) => {
  try {
    await fetch(`http://localhost:5000/api/brands/brands/${id}`, {
      method: 'DELETE',
      signal
    })
    message.success('Xóa thương hiệu thành công')
    fetchBrands()
  } catch (error) {
    if (error.name === 'AbortError') return
    message.error('Có lỗi xảy ra khi xóa thương hiệu')
  }
}

const resetForm = () => {
  Object.assign(formState, initialFormState)
  formRef.value?.resetFields()
}

const fetchBrands = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/brands/list', { signal })
    brands.value = await response.json()
  } catch (error) {
    if (error.name === 'AbortError') return
    message.error('Có lỗi xảy ra khi tải danh sách thương hiệu')
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchBrands()
})

onBeforeUnmount(() => {
  visible.value = false
  confirmLoading.value = false
  controller.abort()
  brands.value = []
})

// Router guard
router.beforeEach((to, from, next) => {
  visible.value = false
  next()
})
</script>