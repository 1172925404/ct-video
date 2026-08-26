<template>
  <div class="history-container">
    <div class="history-header">
      <h1 class="page-title">🕐 观看历史</h1>
      <n-button 
        v-if="historyVideos.length > 0" 
        text 
        type="error" 
        @click="showClearModal = true"
      >
        清空历史
      </n-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <n-spin size="small" />
      <span>加载中...</span>
    </div>
    
    <div v-else-if="historyVideos.length > 0" class="video-grid">
      <VideoCard 
        v-for="video in historyVideos" 
        :key="video.id"
        :video="video"
      />
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">👀</div>
      <h3>还没有观看记录</h3>
      <p>去首页看看，发现你感兴趣的视频吧！</p>
      <n-button type="primary" @click="goHome">去首页</n-button>
    </div>

    <!-- 确认清空弹窗 -->
    <n-modal v-model:show="showClearModal" preset="dialog" title="确认清空">
      <p>确定要清空所有观看历史吗？</p>
      <template #action>
        <n-button @click="showClearModal = false">取消</n-button>
        <n-button type="error" @click="confirmClearHistory">确定</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'  // 👈 添加 onMounted
import { useRouter } from 'vue-router'
import { NButton, NModal, NSpin, useMessage } from 'naive-ui'  // 👈 添加 NSpin, useMessage
import VideoCard from '@/components/video/VideoCard.vue'
import { useVideoStore } from '@/stores/video'

const router = useRouter()
const message = useMessage()  // 👈 新增
const videoStore = useVideoStore()

const showClearModal = ref(false)
const loading = ref(false)  // 👈 新增

const historyVideos = computed(() => videoStore.getHistoryVideos)

const goHome = () => {
  router.push('/')
}

// 👇 新增：从后端加载历史
const loadHistory = async () => {
  loading.value = true
  try {
    await videoStore.loadHistory()
  } catch (error) {
    console.error('加载历史失败:', error)
    message.error('加载历史失败，请重试')
  } finally {
    loading.value = false
  }
}

// 👇 修改：清空历史（异步）
const confirmClearHistory = async () => {
  try {
    await videoStore.clearHistory()
    showClearModal.value = false
    message.success('✅ 历史已清空')
  } catch (error) {
    console.error('清空历史失败:', error)
    message.error('清空历史失败，请重试')
  }
}

// 👇 新增：组件挂载时加载历史
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #212121;
  margin: 0;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: #999;
  font-size: 14px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  color: #212121;
  margin-bottom: 8px;
}

.empty-state p {
  color: #999;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .history-container {
    padding: 12px;
  }
  
  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}
</style>
