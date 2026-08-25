<template>
  <n-message-provider>
    <n-dialog-provider>
      <div id="app">
        <!-- 装饰性浮动元素 -->
        <div class="floating-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
          <div class="shape shape-4"></div>
        </div>

        <AppHeader />
        <div class="page-content">
          <router-view />
        </div>
      </div>
    </n-dialog-provider>
  </n-message-provider>
</template>

<script setup>
import { NMessageProvider, NDialogProvider } from 'naive-ui'
import AppHeader from '@/components/common/AppHeader.vue'
</script>

<style scoped>
#app {
  position: relative;
  min-height: 100vh;
}

/* ===== 装饰性浮动形状 ===== */
.floating-shapes {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
  animation: float 20s ease-in-out infinite;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #fb7299, #ff8aab);
  top: -80px;
  right: -80px;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, #ffb3c6, #ff8aab);
  bottom: 100px;
  left: -60px;
  animation-delay: -5s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, #fb7299, #ff6b8a);
  top: 50%;
  left: 60%;
  animation-delay: -10s;
}

.shape-4 {
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, #ffb3c6, #fb7299);
  bottom: 30%;
  right: 10%;
  animation-delay: -15s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(30px, -40px) scale(1.05);
  }
  50% {
    transform: translate(-20px, 20px) scale(0.95);
  }
  75% {
    transform: translate(40px, 30px) scale(1.02);
  }
}

/* ===== 页面内容层级 ===== */
.page-content {
  position: relative;
  z-index: 1;
}
</style>