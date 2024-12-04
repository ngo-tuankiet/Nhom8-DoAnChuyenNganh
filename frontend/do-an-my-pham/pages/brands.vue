<!-- pages/brands.vue -->
<template>
    <div class="brands-container p-6">
        <a-row :gutter="[16, 16]">
            <a-col v-for="brand in brands" :key="brand.id" :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
                <a-card hoverable class="brand-card" @click="navigateToBrandProducts(brand.id)">
                    <!-- <template #cover>
                        <img :src="brand.image || '/placeholder-brand.png'" :alt="brand.name" class="brand-image" />
                    </template> -->
                    <a-card-meta :title="brand.brand_name">
                        <template #description>
                            <p>{{ brand.description || 'No description available' }}</p>
                        </template>
                    </a-card-meta>
                </a-card>
            </a-col>
        </a-row>

        <!-- Loading state -->
        <div v-if="loading" class="loading-container">
            <a-spin size="large" />
        </div>

        <!-- Error state -->
        <a-alert v-if="error" type="error" :message="error" class="mt-4" />
    </div>
</template>

<script setup>
const brands = ref([])
const loading = ref(false)
const error = ref(null)

// Fetch brands from API
const fetchBrands = async () => {
    try {
        loading.value = true
        error.value = null

        const response = await fetch('http://localhost:5000/api/brands/list')
        if (!response.ok) {
            throw new Error('Failed to fetch brands')
        }

        const data = await response.json()
        brands.value = data
    } catch (err) {
        error.value = err.message
        console.error('Error fetching brands:', err)
    } finally {
        loading.value = false
    }
}
const navigateToBrandProducts = (brandId) => {
    window.location.href = `/brandsnew/${brandId}`;
}
// Fetch brands when component mounts
onMounted(() => {
    fetchBrands()
})
</script>

<style scoped>
.brands-container {
    max-width: 1400px;
    margin: 0 auto;
}

.brand-card {
    height: 100%;
    transition: all 0.3s;
}

.brand-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.brand-image {
    height: 200px;
    object-fit: contain;
    padding: 1rem;
}

.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
}
</style>