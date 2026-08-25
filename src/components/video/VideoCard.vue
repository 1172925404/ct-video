<template>
  <div class="video-card" @click="goToDetail">
    <!-- 封面图 -->
    <div class="video-cover">
      <!-- 👇 修改：使用 coverUrl 计算属性 -->
      <img :src="coverUrl" :alt="video.title" loading="lazy" />
      <span class="video-duration">{{ video.duration }}</span>
    </div>
    
    <!-- 视频信息 -->
    <div class="video-info">
      <h3 class="video-title">{{ video.title }}</h3>
      <div class="video-meta">
        <div class="author-info">
          <!-- 👇 修改：点击头像跳转到作者主页 -->
          <img 
            :src="video.authorAvatar" 
            class="author-avatar" 
            @click.stop="goToUser(video.authorId || video.id)"
          />
          <!-- 👇 修改：点击名字跳转到作者主页 -->
          <span class="author-name" @click.stop="goToUser(video.authorId || video.id)">
            {{ video.author }}
          </span>
        </div>
        <div class="video-stats">
          <span>{{ formatViews(video.views) }} 播放</span>
          <span>·</span>
          <span>{{ formatDate(video.pubDate) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'  // 👈 添加 computed
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { useUserStore } from '@/stores/user'

// 👇 新增：环境变量配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const STATIC_BASE_URL = API_BASE_URL.replace('/api', '')

// 扩展 dayjs 支持相对时间
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps({
  video: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const userStore = useUserStore()

// 👇 新增：计算封面图完整地址
const coverUrl = computed(() => {
  if (!props.video.cover) {
    // 没有封面图时使用默认占位图
    return 'https://picsum.photos/400/225'
  }
  // 如果是相对路径（以 /uploads 开头），拼接后端地址
  if (props.video.cover.startsWith('/uploads')) {
    // 👇 使用环境变量
    return `${STATIC_BASE_URL}${props.video.cover}`
  }
  return props.video.cover
})

// 跳转到视频详情
const goToDetail = () => {
  router.push(`/video/${props.video.id}`)
}

// 👇 修改：跳转到用户主页
const goToUser = (userId) => {
  if (!userId) return
  // 如果是当前用户，跳转到 /user/me
  if (userStore.user && userId === userStore.user.id) {
    router.push('/user/me')
  } else {
    router.push(`/user/${userId}`)
  }
}

// 格式化播放量（万、亿）
const formatViews = (views) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万'
  }
  return views
}

// 格式化发布时间（相对时间）
const formatDate = (date) => {
  return dayjs(date).fromNow()
}
</script>

<style scoped>
.video-card {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 封面图区域 */
.video-cover {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 比例 */
  background: #f0f0f0;
  overflow: hidden;
}

.video-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* 信息区域 */
.video-info {
  padding: 12px 14px;
}

.video-title {
  font-size: 15px;
  font-weight: 500;
  color: #212121;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 10px;
  min-height: 42px;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #999;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;
}

.author-avatar:hover {
  opacity: 0.8;
}

.author-name {
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}

.author-name:hover {
  color: #fb7299;
}

.video-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
</style>
