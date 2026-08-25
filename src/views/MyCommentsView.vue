<template>
  <div class="my-comments-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">💬 我的评论</h1>
      <span class="comment-total">共 {{ comments.length }} 条评论</span>
    </div>

    <!-- 评论列表 -->
    <div v-if="comments.length > 0" class="comment-list">
      <div 
        v-for="comment in comments" 
        :key="comment.id"
        class="comment-item"
      >
        <!-- 视频信息 -->
        <div class="comment-video" @click="goToVideo(comment.videoId)">
          <span class="video-title">{{ getVideoTitle(comment.videoId) }}</span>
          <span class="video-arrow">›</span>
        </div>

        <!-- 评论内容 -->
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-content">{{ comment.content }}</span>
          </div>
          <div class="comment-footer">
            <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
            <span class="comment-likes">❤️ {{ comment.likes }}</span>
          </div>
        </div>

        <!-- 删除按钮 -->
        <n-button 
          size="small" 
          type="error" 
          text
          @click="showDeleteModal(comment)"
        >
          <template #icon>
            <n-icon size="16"><TrashOutline /></n-icon>
          </template>
          删除
        </n-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">💬</div>
      <h3>还没有发表过评论</h3>
      <p>去视频下面发表你的看法吧！</p>
      <n-button type="primary" @click="goHome">去首页</n-button>
    </div>

    <!-- 确认删除弹窗 -->
    <n-modal v-model:show="showModal" preset="dialog" title="确认删除">
      <p>确定要删除这条评论吗？</p>
      <template #action>
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="error" @click="confirmDelete">确定删除</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon, NModal } from 'naive-ui'
import { TrashOutline } from '@vicons/ionicons5'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { useCommentStore } from '@/stores/comment'
import { useUserStore } from '@/stores/user'
import { useVideoStore } from '@/stores/video'  // 👈 新增

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const commentStore = useCommentStore()
const userStore = useUserStore()
const videoStore = useVideoStore()  // 👈 新增

// 当前用户的评论列表
const comments = ref([])

// 删除确认弹窗
const showModal = ref(false)
const deleteTarget = ref(null)

// 加载评论
const loadComments = () => {
  const username = userStore.user?.username
  if (username) {
    comments.value = commentStore.getCommentsByUsername(username)
  } else {
    comments.value = []
  }
}

// 👇 修改：从 videoStore 中查找视频标题
const getVideoTitle = (videoId) => {
  // 优先从 videoStore 中查找（后端数据）
  const video = videoStore.getVideoById(videoId)
  if (video) return video.title
  // 如果找不到，返回占位文字
  return '视频已删除'
}

// 跳转到视频
const goToVideo = (videoId) => {
  router.push(`/video/${videoId}`)
}

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).fromNow()
}

// 显示删除确认弹窗
const showDeleteModal = (comment) => {
  deleteTarget.value = comment
  showModal.value = true
}

// 确认删除
const confirmDelete = () => {
  if (deleteTarget.value) {
    commentStore.deleteComment(deleteTarget.value.videoId, deleteTarget.value.id)
    loadComments()
    showModal.value = false
    deleteTarget.value = null
  }
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 👇 新增：确保视频数据已加载
const loadVideoData = async () => {
  if (videoStore.videos.length === 0) {
    await videoStore.fetchVideos()
  }
}

// 组件挂载时加载
onMounted(async () => {
  await loadVideoData()  // 👈 先加载视频数据
  loadComments()
})
</script>

<style scoped>
.my-comments-container {
  max-width: 900px;
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

.comment-total {
  font-size: 14px;
  color: #999;
}

/* ===== 评论列表 ===== */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s;
}

.comment-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 视频信息 */
.comment-video {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
  font-size: 14px;
  transition: color 0.2s;
}

.comment-video:hover {
  color: #fb7299;
}

.video-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.video-arrow {
  font-size: 18px;
  color: #ccc;
}

/* 评论内容 */
.comment-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comment-content {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  word-break: break-word;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.comment-likes {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 删除按钮 */
.comment-item .n-button {
  margin-top: 8px;
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
  .my-comments-container {
    padding: 12px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .comment-item {
    padding: 14px 16px;
  }
  
  .comment-content {
    font-size: 14px;
  }
}
</style>