<template>
  <div class="post-list">
    <!-- 发布帖子 -->
    <PostEditor @post-created="handlePostCreated" />

    <!-- 帖子列表 -->
    <div v-if="posts.length > 0" class="posts">
      <div
        v-for="post in posts"
        :key="post.id"
        class="post-item"
        @click="goToPost(post.id)"
      >
        <!-- 帖子头部 -->
        <div class="post-header">
          <!-- 👇 修改：点击头像跳转到用户主页 -->
          <img 
            :src="post.avatar" 
            class="post-avatar" 
            @click.stop="goToUser(post.userId, post.author)"
          />
          <div class="post-user">
            <!-- 👇 修改：点击名字跳转到用户主页 -->
            <span class="post-username" @click.stop="goToUser(post.userId, post.author)">
              {{ post.author }}
            </span>
            <span class="post-time">{{ formatTime(post.createdAt) }}</span>
          </div>
          <div class="post-actions-header">
            <n-button
              v-if="canDelete(post)"
              size="small"
              text
              type="error"
              @click.stop="handleDelete(post)"
            >
              <template #icon>
                <n-icon size="16"><TrashOutline /></n-icon>
              </template>
            </n-button>
          </div>
        </div>

        <!-- 帖子标题 -->
        <h3 class="post-title">{{ post.title }}</h3>

        <!-- 帖子内容预览 -->
        <p class="post-preview">{{ getPreview(post.content) }}</p>

        <!-- 图片缩略图 -->
        <div v-if="post.images && post.images.length > 0" class="post-images">
          <img
            v-for="(url, index) in post.images.slice(0, 3)"
            :key="index"
            :src="getImageUrl(url)"
            class="post-thumbnail"
            @click.stop="previewImage(url)"
          />
          <span v-if="post.images.length > 3" class="image-more">
            +{{ post.images.length - 3 }}
          </span>
        </div>

        <!-- 帖子统计 -->
        <div class="post-stats">
          <span class="stat-item">
            <n-icon size="16"><ThumbsUpOutline /></n-icon>
            {{ post.likes }}
          </span>
          <span class="stat-item">
            <n-icon size="16"><ChatbubbleOutline /></n-icon>
            {{ post.comments.length }}
          </span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>还没有帖子</h3>
      <p>快来发布第一条帖子吧！</p>
    </div>

    <!-- 图片预览弹窗 -->
    <n-modal
      v-model:show="showImageModal"
      :style="{ maxWidth: '90vw', maxHeight: '90vh' }"
      :closable="true"
      @click="showImageModal = false"
    >
      <img :src="previewImageUrl" class="modal-image" />
    </n-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon, NModal } from 'naive-ui'
import {
  ThumbsUpOutline,
  ChatbubbleOutline,
  TrashOutline
} from '@vicons/ionicons5'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import PostEditor from './PostEditor.vue'
import { useCommunityStore } from '@/stores/community'
import { useUserStore } from '@/stores/user'

// 👇 新增：环境变量配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const STATIC_BASE_URL = API_BASE_URL.replace('/api', '')

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const communityStore = useCommunityStore()
const userStore = useUserStore()

const props = defineProps({
  posts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['post-created', 'post-deleted'])

// 图片预览
const showImageModal = ref(false)
const previewImageUrl = ref('')

// 👇 修改：拼接图片完整地址（使用环境变量）
const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads')) {
    return `${STATIC_BASE_URL}${url}`
  }
  return url
}

// 👇 修改：goToUser 支持通过 author 名字匹配
const goToUser = (userId, author) => {
  // 如果没有 userId，尝试通过 author 名字匹配当前用户
  if (!userId) {
    // 如果是当前用户，跳转到 /user/me
    if (userStore.user && author === userStore.user.username) {
      router.push('/user/me')
    }
    return
  }
  // 如果是当前用户，跳转到 /user/me
  if (userStore.user && userId === userStore.user.id) {
    router.push('/user/me')
  } else {
    router.push(`/user/${userId}`)
  }
}

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).fromNow()
}

// 内容预览（截取前100字）
const getPreview = (content) => {
  if (!content) return ''
  if (content.length <= 100) return content
  return content.slice(0, 100) + '...'
}

// 判断是否可删除
const canDelete = (post) => {
  const currentUser = userStore.user
  return currentUser && post.author === currentUser.username
}

// 跳转到帖子详情
const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

// 预览图片
const previewImage = (url) => {
  previewImageUrl.value = url
  showImageModal.value = true
}

// 删除帖子
const handleDelete = (post) => {
  if (confirm('确定要删除这条帖子吗？')) {
    communityStore.deletePost(post.id)
    emit('post-deleted')
  }
}

// 帖子发布成功
const handlePostCreated = () => {
  emit('post-created')
}
</script>

<style scoped>
.post-list {
  max-width: 700px;
  margin: 0 auto;
}

.posts {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

/* ===== 帖子卡片 ===== */
.post-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.post-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* 帖子头部 */
.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.post-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.post-avatar:hover {
  opacity: 0.8;
}

.post-user {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-username {
  font-size: 14px;
  font-weight: 500;
  color: #212121;
  cursor: pointer;
  transition: color 0.2s;
}

.post-username:hover {
  color: #fb7299;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.post-actions-header {
  flex-shrink: 0;
}

/* 帖子标题 */
.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #212121;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

/* 内容预览 */
.post-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 图片缩略图 */
.post-images {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.post-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #e8e8e8;
  transition: transform 0.2s;
}

.post-thumbnail:hover {
  transform: scale(1.05);
}

.image-more {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #999;
}

/* 帖子统计 */
.post-stats {
  display: flex;
  gap: 16px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #999;
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

/* ===== 图片预览弹窗 ===== */
.modal-image {
  max-width: 90vw;
  max-height: 85vh;
  border-radius: 8px;
  object-fit: contain;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .post-list {
    padding: 0 4px;
  }

  .post-item {
    padding: 14px 16px;
  }

  .post-title {
    font-size: 16px;
  }

  .post-preview {
    font-size: 13px;
    -webkit-line-clamp: 2;
  }

  .post-thumbnail {
    width: 64px;
    height: 64px;
  }

  .image-more {
    width: 64px;
    height: 64px;
    font-size: 14px;
  }
}
</style>
