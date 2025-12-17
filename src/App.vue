<template>
  <div class="app-container">
    <ImageAnnotator :image-list="mockData" :labels="['Deer', 'Person', 'Shoes']" @save="handleSave"
      @back="handleBack" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ImageAnnotator from './components/ImageAnnotator.vue';
import { mockImageList } from './mock/data';

const mockData = ref(mockImageList);

const handleSave = (data: any) => {
  console.log('[Parent] Receive Save Data:', data);
  // 这里可以写实际的业务逻辑，比如调用 API
};

const handleBack = () => {
  console.log('[Parent] Back Clicked');
};
</script>

<style>
/* 全局引入 Element Plus 样式 */
@import 'element-plus/dist/index.css';

body,
html {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.app-container {
  width: 100vw;
  height: 100vh;
}
</style>
