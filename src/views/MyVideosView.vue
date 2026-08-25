<template>
    <div class="my-videos-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h1 class="page-title">📺 我发布的视频</h1>
        <span class="video-total">共 {{ videos.length }} 个视频</span>
      </div>
  
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <n-spin size="small" />
        <span>加载中...</span>
      </div>
  
      <!-- 视频列表 -->
      <div v-else-if="videos.length > 0" class="video-grid">
        <div
          v-for="video in videos"
          :key="video.id"
          class="video-card"
        >
          <!-- 视频封面 -->
          <div class="video-cover" @click="goToVideo(video.id)">
            <img :src="getCoverUrl(video.cover)" :alt="video.title" loading="lazy" />
            <span class="video-duration">{{ video.duration || '00:00' }}</span>
          </div>
  
          <!-- 视频信息 -->
          <div class="video-info">
            <h3 class="video-title" @click="goToVideo(video.id)">{{ video.title }}</h3>
            <div class="video-stats">
              <span>{{ formatViews(video.views) }} 播放</span>
              <span>·</span>
              <span>{{ formatDate(video.pubDate) }}</span>
            </div>
          </div>
  
          <!-- 操作按钮 -->
          <div class="video-actions">
            <n-button size="small" @click="goToEdit(video.id)">
              <template #icon>
                <n-icon><CreateOutline /></n-icon>
              </template>
              编辑
            </n-button>
            <n-button size="small" type="error" @click="handleDelete(video)">
              <template #icon>
                <n-icon><TrashOutline /></n-icon>
              </template>
              删除
            </n-button>
          </div>
        </div>
      </div>
  
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📹</div>
        <h3>还没有发布视频</h3>
        <p>去上传你的第一个视频吧！</p>
        <n-button type="primary" @click="goToUpload">去上传</n-button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { NButton, NIcon, NSpin, useDialog, useMessage } from 'naive-ui'
  import { CreateOutline, TrashOutline } from '@vicons/ionicons5'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import 'dayjs/locale/zh-cn'
  import { useUserStore } from '@/stores/user'
  import { useVideoStore } from '@/stores/video'
  import { getUserVideos } from '@/api/user'
  import { deleteVideo } from '@/api/video'

  // 👇 新增：环境变量配置
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const STATIC_BASE_URL = API_BASE_URL.replace('/api', '')
  
  dayjs.extend(relativeTime)
  dayjs.locale('zh-cn')
  
  const router = useRouter()
  const dialog = useDialog()
  const message = useMessage()
  const userStore = useUserStore()
  const videoStore = useVideoStore()
  
  const videos = ref([])
  const loading = ref(false)
  
  // ===== 加载我发布的视频 =====
  const loadMyVideos = async () => {
    const userId = userStore.user?.id
    if (!userId) {
      router.push('/')
      return
    }
  
    loading.value = true
    try {
      const data = await getUserVideos(userId)
      if (data.success) {
        videos.value = data.data || []
      }
    } catch (error) {
      console.error('加载视频失败:', error)
      message.error('加载视频失败，请重试')
    } finally {
      loading.value = false
    }
  }
  
  // ===== 获取封面图完整地址（使用环境变量） =====
  const getCoverUrl = (cover) => {
    if (!cover) return 'https://picsum.photos/400/225'
    if (cover.startsWith('/uploads')) {
      return `${STATIC_BASE_URL}${cover}`
    }
    return cover
  }
  
  // ===== 格式化播放量 =====
  const formatViews = (views) => {
    if (views >= 10000) {
      return (views / 10000).toFixed(1) + '万'
    }
    return views
  }
  
  // ===== 格式化时间 =====
  const formatDate = (date) => {
    return dayjs(date).fromNow()
  }
  
  // ===== 跳转到视频详情 =====
  const goToVideo = (videoId) => {
    router.push(`/video/${videoId}`)
  }
  
  // ===== 跳转到编辑页面 =====
  const goToEdit = (videoId) => {
    router.push(`/video/edit/${videoId}`)
  }
  
  // ===== 跳转到上传页面 =====
  const goToUpload = () => {
    router.push('/upload')
  }
  
  // ===== 删除视频 =====
  const handleDelete = (video) => {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除「${video.title}」吗？删除后无法恢复！`,
      positiveText: '确定删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await deleteVideo(video.id)
          // 从列表中移除
          const index = videos.value.findIndex(v => v.id === video.id)
          if (index > -1) {
            videos.value.splice(index, 1)
          }
          // 刷新视频列表
          await videoStore.fetchVideos()
          message.success('✅ 视频已删除')
        } catch (error) {
          console.error('删除失败:', error)
          message.error(error.message || '删除失败，请重试')
        }
      }
    })
  }
  
  // ===== 组件挂载 =====
  onMounted(() => {
    loadMyVideos()
  })
  </script>
  
  <style scoped>
  .my-videos-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  /* ===== 页面头部 ===== */
  .page-header {
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
  
  .video-total {
    font-size: 14px;
    color: #999;
  }
  
  /* ===== 加载状态 ===== */
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 0;
    color: #999;
    font-size: 14px;
  }
  
  /* ===== 视频网格 ===== */
  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
  
  /* ===== 视频卡片 ===== */
  .video-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.3s;
  }
  
  .video-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .video-cover {
    position: relative;
    padding-bottom: 56.25%;
    background: #f0f0f0;
    cursor: pointer;
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
  }
  
  .video-info {
    padding: 12px 14px;
  }
  
  .video-title {
    font-size: 15px;
    font-weight: 500;
    color: #212121;
    cursor: pointer;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 42px;
    margin: 0 0 6px 0;
  }
  
  .video-title:hover {
    color: #fb7299;
  }
  
  .video-stats {
    font-size: 13px;
    color: #999;
    display: flex;
    gap: 6px;
  }
  
  .video-actions {
    display: flex;
    gap: 8px;
    padding: 8px 14px 14px;
    border-top: 1px solid #f0f0f0;
  }
  
  /* ===== 空状态 ===== */
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
  
  /* ===== 响应式 ===== */
  @media (max-width: 768px) {
    .my-videos-container {
      padding: 12px;
    }
  
    .video-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }
  
    .video-title {
      font-size: 14px;
      min-height: 38px;
    }
  
    .video-actions {
      flex-direction: column;
    }
  
    .video-actions .n-button {
      width: 100%;
    }
  }
  </style>
