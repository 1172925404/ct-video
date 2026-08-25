<template>
  <div class="video-player-wrapper">
    <!-- 视频播放器 -->
    <div class="video-container">
      <video 
        ref="videoRef"
        class="video-player"
        :src="videoUrl"
        :poster="video.cover"
        controls
        @loadedmetadata="onLoaded"
        @timeupdate="onTimeUpdate"
      >
        您的浏览器不支持视频播放
      </video>
      
      <div class="video-badge">
        <span class="badge-icon">▶</span>
        <span class="badge-text">{{ video.duration }}</span>
      </div>
    </div>

    <!-- 视频信息 -->
    <div class="video-info-section">
      <h1 class="video-title">{{ video.title }}</h1>
      
      <div class="video-meta-bar">
        <div class="meta-left">
          <div class="author-section">
            <!-- 👇 修改：点击头像跳转到作者主页 -->
            <img 
              :src="video.authorAvatar" 
              class="author-avatar-large" 
              @click="goToUser(video.authorId || video.id)"
            />
            <div class="author-detail">
              <!-- 👇 修改：点击名字跳转到作者主页 -->
              <span class="author-name" @click="goToUser(video.authorId || video.id)">
                {{ video.author }}
              </span>
              <span class="author-sub">UP主 · 发布了3个视频</span>
            </div>
          </div>
          <div class="video-stats">
            <span>{{ formatViews(video.views) }} 播放</span>
            <span class="dot">·</span>
            <span>{{ formatDate(video.pubDate) }}</span>
          </div>
        </div>
        
        <VideoActions 
          :video="video" 
          @like="handleLike"
          @favorite="handleFavorite"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'  // 添加 computed
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import VideoActions from './VideoActions.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps({
  video: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['like', 'favorite'])

const router = useRouter()
const videoRef = ref(null)

// 计算视频地址：从后端获取的视频 url，或者使用默认测试视频
const videoUrl = computed(() => {
  // 如果视频有 url 字段，使用它
  if (props.video.url) {
    // 如果是相对路径（以 /uploads 开头），拼接后端地址
    if (props.video.url.startsWith('/uploads')) {
      return `http://localhost:3000${props.video.url}`
    }
    return props.video.url
  }
  // 兜底：使用默认测试视频
  return 'https://www.w3schools.com/html/mov_bbb.mp4'
})

// 修改 goToUser 方法
const goToUser = (userId) => {
  if (!userId) return
  // 如果是当前用户，跳转到 /user/me
  if (userStore.user && userId === userStore.user.id) {
    router.push('/user/me')
  } else {
    router.push(`/user/${userId}`)
  }
}

const formatViews = (views) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万'
  }
  return views
}

const formatDate = (date) => {
  return dayjs(date).fromNow()
}

const onLoaded = () => {
  console.log('视频加载完成')
}

const onTimeUpdate = () => {
  // 可以在这里更新播放进度
}

const handleLike = () => {
  emit('like')
}

const handleFavorite = () => {
  emit('favorite')
}
</script>

<style scoped>
.video-player-wrapper {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.video-container {
  position: relative;
  background: #000;
  aspect-ratio: 16 / 9;
}

.video-player {
  width: 100%;
  height: 100%;
  display: block;
}

.video-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  backdrop-filter: blur(4px);
}

.badge-icon {
  color: #fb7299;
  font-size: 16px;
}

.video-info-section {
  padding: 24px 28px;
}

.video-title {
  font-size: 22px;
  font-weight: 600;
  color: #212121;
  margin-bottom: 16px;
  line-height: 1.4;
}

.video-meta-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.author-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.author-avatar-large {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;
}

.author-avatar-large:hover {
  opacity: 0.8;
}

.author-detail {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 15px;
  font-weight: 500;
  color: #212121;
  cursor: pointer;
  transition: color 0.2s;
}

.author-name:hover {
  color: #fb7299;
}

.author-sub {
  font-size: 13px;
  color: #999;
}

.video-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #999;
}

.dot {
  color: #ddd;
}

@media (max-width: 768px) {
  .video-info-section {
    padding: 16px;
  }
  
  .video-title {
    font-size: 17px;
  }
  
  .video-meta-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .meta-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>