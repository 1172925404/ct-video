<template>
  <div class="video-list-container">
    <!-- ===== 页面头部 ===== -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">📺 全部视频</h1>
        <span class="video-total">共 {{ totalVideos }} 个视频</span>
      </div>
      <div class="header-right">
        <!-- 视图切换 -->
        <n-button-group>
          <n-button
            :type="viewMode === 'grid' ? 'primary' : 'default'"
            @click="viewMode = 'grid'"
          >
            <template #icon>
              <n-icon><GridOutline /></n-icon>
            </template>
          </n-button>
          <n-button
            :type="viewMode === 'list' ? 'primary' : 'default'"
            @click="viewMode = 'list'"
          >
            <template #icon>
              <n-icon><ListOutline /></n-icon>
            </template>
          </n-button>
        </n-button-group>
      </div>
    </div>

    <!-- ===== 分类标签 ===== -->
    <div class="filter-bar">
      <div class="category-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-item"
          :class="{ active: currentCategory === tab.value }"
          @click="handleCategoryChange(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 排序下拉 -->
      <div class="sort-select">
        <n-select
          v-model:value="currentSort"
          :options="sortOptions"
          size="small"
          style="width: 140px"
          @update:value="handleSortChange"
        />
      </div>
    </div>

    <!-- ===== 标签筛选栏 ===== -->
    <div v-if="allTags.length > 0" class="tag-bar">
      <span class="tag-bar-label">🏷️ 标签筛选：</span>
      <button
        class="tag-item"
        :class="{ active: currentTag === '' }"
        @click="handleTagChange('')"
      >
        全部
      </button>
      <button
        v-for="tag in allTags"
        :key="tag"
        class="tag-item"
        :class="{ active: currentTag === tag }"
        @click="handleTagChange(tag)"
      >
        #{{ tag }}
      </button>
    </div>

    <!-- ===== 视频列表 ===== -->
    <div v-if="paginatedVideos.length > 0" class="video-list">
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="video-grid">
        <VideoCard
          v-for="video in paginatedVideos"
          :key="video.id"
          :video="video"
        />
      </div>

      <!-- 列表视图 -->
      <div v-else class="video-list-view">
        <div
          v-for="video in paginatedVideos"
          :key="video.id"
          class="video-list-item"
          @click="goToVideo(video.id)"
        >
          <!-- 封面图 -->
          <div class="list-item-cover">
            <img :src="video.cover" :alt="video.title" loading="lazy" />
            <span class="list-item-duration">{{ video.duration }}</span>
          </div>

          <!-- 信息 -->
          <div class="list-item-info">
            <h3 class="list-item-title">{{ video.title }}</h3>
            <!-- 标签 -->
            <div v-if="video.tags && video.tags.length > 0" class="list-item-tags">
              <span v-for="tag in video.tags.slice(0, 3)" :key="tag" class="list-item-tag">
                #{{ tag }}
              </span>
              <span v-if="video.tags.length > 3" class="list-item-tag-more">
                +{{ video.tags.length - 3 }}
              </span>
            </div>
            <div class="list-item-meta">
              <span class="list-item-author">{{ video.author }}</span>
              <span class="list-item-stats">
                {{ formatViews(video.views) }} 播放 · {{ formatLikes(video.likes) }} 点赞
              </span>
              <span class="list-item-date">{{ formatDate(video.pubDate) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>暂无视频</h3>
      <p>当前筛选条件下没有视频，试试调整筛选条件吧</p>
    </div>

    <!-- ===== 分页 ===== -->
    <div v-if="totalVideos > 0" class="pagination-wrapper">
      <n-pagination
        v-model:page="currentPage"
        :page-count="totalPages"
        :page-size="pageSize"
        show-size-picker
        :page-sizes="[8, 12, 24, 48]"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch,onMounted } from 'vue'   // 添加 onMounted
import { useRouter } from 'vue-router'
import {
  NButton,
  NButtonGroup,
  NIcon,
  NSelect,
  NPagination
} from 'naive-ui'
import { GridOutline, ListOutline } from '@vicons/ionicons5'
import VideoCard from '@/components/video/VideoCard.vue'
import { useVideoStore } from '@/stores/video'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const videoStore = useVideoStore()

// ===== 分类 =====
const tabs = [
  { label: '🔥 推荐', value: 'recommend' },
  { label: '📈 热门', value: 'hot' },
  { label: '🆕 最新', value: 'latest' },
  { label: '⭐ 关注', value: 'follow' }
]
const currentCategory = ref('recommend')

// ===== 排序 =====
const sortOptions = [
  { label: '最新发布', value: 'latest' },
  { label: '最热播放', value: 'mostView' },
  { label: '最多点赞', value: 'mostLike' },
  { label: '最早发布', value: 'oldest' }
]
const currentSort = ref('latest')

// ===== 标签 =====
const currentTag = ref('')
const allTags = computed(() => videoStore.getAllTags())

// ===== 视图模式 =====
const viewMode = ref('grid')

// ===== 分页 =====
const currentPage = ref(1)
const pageSize = ref(12)

// ===== 获取所有视频（按分类 + 标签 + 排序） =====
const allVideos = computed(() => {
  return videoStore.getVideosWithFilters(
    currentCategory.value,
    currentTag.value || null,
    currentSort.value
  )
})

// ===== 总数 =====
const totalVideos = computed(() => allVideos.value.length)

// ===== 总页数 =====
const totalPages = computed(() => Math.ceil(totalVideos.value / pageSize.value))

// ===== 当前页的视频 =====
const paginatedVideos = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allVideos.value.slice(start, end)
})

// ===== 方法 =====
const handleCategoryChange = (category) => {
  currentCategory.value = category
  currentPage.value = 1
}

const handleSortChange = () => {
  currentPage.value = 1
}

const handleTagChange = (tag) => {
  currentTag.value = tag
  currentPage.value = 1
}

const handlePageChange = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const goToVideo = (videoId) => {
  router.push(`/video/${videoId}`)
}

// ===== 格式化 =====
const formatViews = (views) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万'
  }
  return views
}

const formatLikes = (likes) => {
  if (likes >= 10000) {
    return (likes / 10000).toFixed(1) + '万'
  }
  if (likes >= 1000) {
    return (likes / 1000).toFixed(1) + 'k'
  }
  return likes
}

const formatDate = (date) => {
  return dayjs(date).fromNow()
}

// ===== 监听筛选变化，重置页码 =====
watch([currentCategory, currentSort, currentTag], () => {
  currentPage.value = 1
})

// ===== 在组件挂载时加载数据 =====
onMounted(async () => {
  await videoStore.fetchVideos()
  await videoStore.fetchTags()
})
</script>



<style scoped>
.video-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* ===== 页面头部 ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #212121;
  margin: 0;
}

.video-total {
  font-size: 14px;
  color: #999;
}

/* ===== 筛选栏 ===== */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.category-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-item {
  padding: 6px 16px;
  border: none;
  border-radius: 16px;
  background: #f0f0f0;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-item:hover {
  background: #e0e0e0;
}

.tab-item.active {
  background: #fb7299;
  color: #fff;
}

.sort-select {
  flex-shrink: 0;
}

/* ===== 标签筛选栏 ===== */
.tag-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
  padding: 10px 14px;
  background: #f8f9fa;
  border-radius: 8px;
}

.tag-bar-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  margin-right: 4px;
}

.tag-item {
  padding: 4px 12px;
  border: none;
  border-radius: 12px;
  background: #e8e8e8;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.tag-item:hover {
  background: #d0d0d0;
}

.tag-item.active {
  background: #fb7299;
  color: #fff;
}

/* ===== 视频网格 ===== */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

/* ===== 视频列表视图 ===== */
.video-list-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-list-item {
  display: flex;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.video-list-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.list-item-cover {
  position: relative;
  flex-shrink: 0;
  width: 200px;
  height: 112px;
  background: #f0f0f0;
  overflow: hidden;
}

.list-item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-item-duration {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.list-item-info {
  flex: 1;
  padding: 12px 16px 12px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.list-item-title {
  font-size: 16px;
  font-weight: 500;
  color: #212121;
  margin: 0 0 4px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.list-item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.list-item-tag {
  font-size: 11px;
  color: #fb7299;
  background: #fce8ee;
  padding: 1px 8px;
  border-radius: 10px;
}

.list-item-tag-more {
  font-size: 11px;
  color: #999;
}

.list-item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #999;
  flex-wrap: wrap;
}

.list-item-author {
  color: #666;
}

.list-item-stats {
  color: #999;
}

.list-item-date {
  color: #bbb;
}

/* ===== 分页 ===== */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* ===== 空状态 ===== */
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

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .video-list-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .category-tabs {
    justify-content: center;
  }

  .sort-select {
    align-self: flex-end;
  }

  .tag-bar {
    padding: 8px 12px;
    gap: 4px;
  }

  .tag-item {
    font-size: 11px;
    padding: 3px 10px;
  }

  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .list-item-cover {
    width: 140px;
    height: 80px;
  }

  .list-item-title {
    font-size: 14px;
  }

  .list-item-meta {
    font-size: 12px;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .list-item-cover {
    width: 110px;
    height: 62px;
  }

  .list-item-info {
    padding: 8px 10px 8px 0;
  }
}
</style>