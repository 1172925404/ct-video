<template>
  <div class="favorites-container">
    <h1 class="page-title">❤️ 我的收藏</h1>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <n-spin size="small" />
      <span>加载中...</span>
    </div>

    <!-- 收藏视频列表 -->
    <div v-else-if="favoriteVideos.length > 0" class="video-grid">
      <VideoCard 
        v-for="video in favoriteVideos" 
        :key="video.id"
        :video="video"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">💔</div>
      <h3>还没有收藏的视频</h3>
      <p>去首页逛逛，收藏你喜欢的视频吧！</p>
      <n-button type="primary" @click="goHome">去首页</n-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NSpin } from 'naive-ui'
import VideoCard from '@/components/video/VideoCard.vue'
import { useVideoStore } from '@/stores/video'

const router = useRouter()
const videoStore = useVideoStore()

const loading = ref(false)

const favoriteVideos = computed(() => videoStore.getFavoriteVideos)

const goHome = () => {
  router.push('/')
}

// 👇 页面加载时从后端拉取收藏列表
const loadFavorites = async () => {
  loading.value = true
  try {
    await videoStore.loadFavorites()
  } catch (error) {
    console.error('加载收藏列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFavorites()
})
</script>

<style scoped>
.favorites-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #212121;
  margin-bottom: 24px;
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

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: #999;
  font-size: 14px;
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}
</style>