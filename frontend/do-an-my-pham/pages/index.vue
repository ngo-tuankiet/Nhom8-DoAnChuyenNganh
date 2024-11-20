<template>
    <div>
        <div class="slider">
            <div v-for="(image, index) in images" :key="index" class="slide"
                :class="{ active: index === currentIndex }">
                <img :src="image" alt="slide image" />
            </div>
        </div>
        <a-row type="flex" justify="center" align="middle" style="height: 100px;">
            <a-col>
                <h1 style="font-size: 50px;margin-bottom: 150px;">TOP SẢN PHẨM BÁN CHẠY</h1>
            </a-col>
        </a-row>

        
    </div>
</template>

<script>
import axios from 'axios';
export default {
   
    data() {
        return {
            images: [
                'https://file.hstatic.net/1000391653/file/slider-ct-28---31__1__master.jpg',
                'https://file.hstatic.net/1000391653/file/crazynight-new_1_master.jpg',
                'https://file.hstatic.net/1000391653/file/dbt-new_1_master.jpg'
            ],
            currentIndex: 0,
        };
    },
};
    
</script>

<style scoped>
.slider {
    position: relative;
    width: 100%;
    height: 500px;
    overflow: hidden;
}

.slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.slide {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.5s ease, transform 0.5s ease;
    transform: translateX(100%);
}

.slide.active {
    opacity: 1;
    transform: translateX(0);
}


</style>
