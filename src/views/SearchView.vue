<template>
    <div class="search-container">
      <!-- 搜索头部 -->
      <div class="search-header">
        <h1 class="search-title">🔍 搜索结果</h1>
        <p v-if="keyword" class="search-keyword">
          包含 "{{ keyword }}" 的视频
        </p>
      </div>
  
      <!-- 搜索结果列表 -->
      <div v-if="searchResults.length > 0" class="video-grid">
        <VideoCard 
          v-for="video in searchResults" 
          :key="video.id"
          :video="video"
        />
      </div>
  
      <!-- 空状态 -->
      <div v-else-if="keyword && searchResults.length === 0" class="empty-state">
        <div class="empty-icon">🔎</div>
        <h3>没有找到相关视频</h3>
        <p>试试其他关键词吧</p>
        <n-button type="primary" @click="goHome">返回首页</n-button>
      </div>
  
      <!-- 加载中 -->
      <div v-else class="loading-state">
        <n-spin size="large" />
        <p>搜索中...</p>
      </div>
    </div>
</template>
  
<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { NButton, NSpin } from 'naive-ui'
  import VideoCard from '@/components/video/VideoCard.vue'
  import { useVideoStore } from '@/stores/video'
  
  const route = useRoute()
  const router = useRouter()
  const videoStore = useVideoStore()
  
  // 关键词（从 URL 参数获取）
  const keyword = ref('')
  
  // 搜索结果
  const searchResults = ref([])
  
  // 执行搜索
  const performSearch = () => {
    const kw = route.query.q || ''
    keyword.value = kw
    
    if (kw.trim() === '') {
      searchResults.value = []
      return
    }
    
    searchResults.value = videoStore.searchVideos(kw)
  }
  
  // 返回首页
  const goHome = () => {
    router.push('/')
  }
  
  // 监听路由变化（当用户从其他页面跳转过来）
  watch(
    () => route.query.q,
    () => {
      performSearch()
    },
    { immediate: true }
  )
  
  // 组件挂载时执行搜索
  onMounted(() => {
    performSearch()
  })
</script>
  
<style scoped>
  .search-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .search-header {
    margin-bottom: 24px;
  }
  
  .search-title {
    font-size: 24px;
    font-weight: 600;
    color: #212121;
    margin-bottom: 4px;
  }
  
  .search-keyword {
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
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: 16px;
    color: #999;
  }
  
  @media (max-width: 768px) {
    .video-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }
    
    .search-container {
      padding: 12px;
    }
    
    .search-title {
      font-size: 20px;
    }
  }
</style>