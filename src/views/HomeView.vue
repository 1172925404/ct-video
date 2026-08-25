<template>
  <div class="home-container">
    <!-- 分类标签 -->
    <div class="category-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @click="switchCategory(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="videoStore.loading" class="load-status">
      <n-spin size="small" />
      <span>加载视频中...</span>
    </div>

    <!-- 视频网格 -->
    <div v-else-if="displayVideos.length > 0" class="video-grid">
      <VideoCard 
        v-for="video in displayVideos" 
        :key="video.id"
        :video="video"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>暂无视频</h3>
      <p>当前分类下还没有视频</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loadingMore" class="load-status">
      <n-spin size="small" />
      <span>加载中...</span>
    </div>

    <!-- 没有更多 -->
    <div v-else-if="!hasMore && displayVideos.length > 0" class="load-status no-more">
      <span>— 已加载全部视频 —</span>
    </div>

    <!-- 加载更多按钮（备用） -->
    <div v-else-if="hasMore && displayVideos.length > 0" class="load-more">
      <n-button @click="loadMore" :loading="loadingMore">
        加载更多
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NSpin, NButton } from 'naive-ui'
import VideoCard from '@/components/video/VideoCard.vue'
import { useVideoStore } from '@/stores/video'

const videoStore = useVideoStore()

// ===== 分类标签 =====
const tabs = [
  { label: '🔥 推荐', value: 'recommend' },
  { label: '📈 热门', value: 'hot' },
  { label: '🆕 最新', value: 'latest' },
  { label: '⭐ 关注', value: 'follow' }
]

const currentTab = ref('recommend')

// ===== 分页加载 =====
const PAGE_SIZE = 6
const currentPage = ref(1)
const loadingMore = ref(false)

// 获取当前分类的所有视频（已排序）
const getAllVideos = computed(() => {
  return videoStore.getVideosByCategory(currentTab.value)
})

// 当前显示的视频（按页码截取）
const displayVideos = computed(() => {
  return getAllVideos.value.slice(0, currentPage.value * PAGE_SIZE)
})

// 是否还有更多数据
const hasMore = computed(() => {
  return displayVideos.value.length < getAllVideos.value.length
})

// ===== 加载更多 =====
const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  
  setTimeout(() => {
    currentPage.value += 1
    loadingMore.value = false
  }, 500)
}

// ===== 切换分类 =====
const switchCategory = (category) => {
  if (currentTab.value === category) return
  currentTab.value = category
  currentPage.value = 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ===== 滚动加载 =====
const handleScroll = () => {
  if (loadingMore.value || !hasMore.value) return

  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  if (scrollTop + windowHeight >= documentHeight - 200) {
    loadMore()
  }
}

// ===== 加载视频数据 =====
const loadVideos = async () => {
  await videoStore.fetchVideos()
}

// ===== 生命周期 =====
onMounted(async () => {
  await loadVideos()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.category-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tab-item {
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  background: #f0f0f0;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-item:hover {
  background: #e0e0e0;
  transform: translateY(-1px);
}

.tab-item.active {
  background: #fb7299;
  color: #fff;
  box-shadow: 0 2px 8px rgba(251, 114, 153, 0.3);
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.load-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 30px 0;
  color: #999;
  font-size: 14px;
}

.load-status.no-more {
  color: #ccc;
  font-size: 13px;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 20px 0 10px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state h3 {
  font-size: 18px;
  color: #212121;
  margin-bottom: 4px;
}

.empty-state p {
  color: #999;
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
  
  .home-container {
    padding: 12px;
  }
  
  .tab-item {
    padding: 6px 14px;
    font-size: 13px;
  }
}
</style>