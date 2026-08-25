<template>
  <div class="post-detail-container">
    <div v-if="post" class="post-detail">
      <!-- 返回按钮 -->
      <n-button quaternary @click="goBack">
        <template #icon>
          <n-icon><ArrowBack /></n-icon>
        </template>
        返回社区
      </n-button>

      <!-- 帖子卡片 -->
      <div class="post-card">
        <!-- 帖子头部 -->
        <div class="post-header">
          <!-- 👇 修改：点击头像跳转到用户主页 -->
          <img 
            :src="post.avatar" 
            class="post-avatar" 
            @click="goToUser(post.userId || post.id)"
          />
          <div class="post-user">
            <!-- 👇 修改：点击名字跳转到用户主页 -->
            <span class="post-username" @click="goToUser(post.userId || post.id)">
              {{ post.author }}
            </span>
            <span class="post-time">{{ formatTime(post.createdAt) }}</span>
          </div>
          <n-button
            v-if="canDelete"
            size="small"
            text
            type="error"
            class="delete-btn"
            @click="handleDelete"
          >
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
            删除
          </n-button>
        </div>

        <!-- 帖子标题 -->
        <h1 class="post-title">{{ post.title }}</h1>

        <!-- 帖子完整内容 -->
        <div class="post-content">
          <p>{{ post.content }}</p>
        </div>

        <!-- 帖子图片 -->
        <div v-if="post.images && post.images.length > 0" class="post-images">
          <img
            v-for="(url, index) in post.images"
            :key="index"
            :src="getImageUrl(url)"
            class="detail-image"
            @click="previewImage(url)"
          />
        </div>

        <!-- 帖子操作 -->
        <div class="post-actions">
          <n-button text @click="handleLike">
            <template #icon>
              <n-icon size="20">
                <ThumbsUp v-if="post.liked" />
                <ThumbsUpOutline v-else />
              </n-icon>
            </template>
            {{ post.likes > 0 ? post.likes : '点赞' }}
          </n-button>
          <span class="action-divider">·</span>
          <span class="action-comment-count">{{ post.comments.length }} 条评论</span>
        </div>
      </div>

      <!-- 评论输入 -->
      <div class="comment-input-wrapper">
        <div class="comment-input-header">
          <img
            v-if="userStore.getIsLoggedIn"
            :src="userStore.getUserAvatar"
            class="comment-avatar"
          />
          <div v-else class="comment-avatar placeholder">?</div>
          <span class="comment-tip">
            {{ userStore.getIsLoggedIn ? '发表你的评论' : '请先登录再评论' }}
          </span>
        </div>
        <div class="comment-input-body">
          <n-input
            v-model:value="commentContent"
            placeholder="说点什么吧..."
            :disabled="!userStore.getIsLoggedIn"
            @keyup.enter="handleSubmitComment"
          />
          <n-button
            type="primary"
            size="small"
            :disabled="!canSubmitComment"
            @click="handleSubmitComment"
          >
            发布
          </n-button>
        </div>
      </div>

      <!-- 评论列表 -->
      <div v-if="post.comments.length > 0" class="comment-list">
        <div
          v-for="comment in post.comments"
          :key="comment.id"
          class="comment-item"
        >
          <!-- 👇 修改：点击头像跳转到用户主页 -->
          <img 
            :src="comment.avatar" 
            class="comment-avatar" 
            @click="goToUser(comment.userId || comment.id)"
          />
          <div class="comment-body">
            <div class="comment-header">
              <!-- 👇 修改：点击名字跳转到用户主页 -->
              <span class="comment-username" @click="goToUser(comment.userId || comment.id)">
                {{ comment.author }}
              </span>
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              <n-button
                v-if="canDeleteComment(comment)"
                size="small"
                text
                type="error"
                @click="handleDeleteComment(comment)"
              >
                <template #icon>
                  <n-icon size="14"><TrashOutline /></n-icon>
                </template>
              </n-button>
            </div>
            <p class="comment-content">{{ comment.content }}</p>
          </div>
        </div>
      </div>

      <div v-else class="empty-comments">
        <p>还没有评论，快来发表你的看法吧！</p>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-else class="loading-state">
      <n-spin size="large" />
      <p>加载中...</p>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NIcon, NInput, NSpin, NModal } from 'naive-ui'
import {
  ArrowBack,
  ThumbsUp,
  ThumbsUpOutline,
  TrashOutline
} from '@vicons/ionicons5'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { useCommunityStore } from '@/stores/community'
import { useUserStore } from '@/stores/user'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()
const communityStore = useCommunityStore()
const userStore = useUserStore()

const post = ref(null)
const commentContent = ref('')
const showImageModal = ref(false)
const previewImageUrl = ref('')

// 👇 新增：拼接图片完整地址
const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads')) {
    return `http://localhost:3000${url}`
  }
  return url
}

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

// 获取帖子
const loadPost = () => {
  const id = Number(route.params.id)
  const found = communityStore.getPostById(id)
  if (found) {
    post.value = found
  } else {
    router.push('/chat')
  }
}

// 是否可删除帖子
const canDelete = computed(() => {
  const currentUser = userStore.user
  return currentUser && post.value && post.value.author === currentUser.username
})

// 是否可删除评论
const canDeleteComment = (comment) => {
  const currentUser = userStore.user
  return currentUser && comment.author === currentUser.username
}

// 是否可以提交评论
const canSubmitComment = computed(() => {
  return userStore.getIsLoggedIn && commentContent.value.trim().length > 0
})

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).fromNow()
}

// 返回
const goBack = () => {
  router.push('/chat')
}

// 点赞
const handleLike = () => {
  if (post.value) {
    communityStore.togglePostLike(post.value.id)
  }
}

// 提交评论
const handleSubmitComment = () => {
  if (!canSubmitComment.value) return

  const user = userStore.user
  communityStore.addPostComment(
    post.value.id,
    user.username,
    user.avatar,
    commentContent.value.trim()
  )
  commentContent.value = ''
}

// 删除帖子
const handleDelete = () => {
  if (confirm('确定要删除这条帖子吗？')) {
    communityStore.deletePost(post.value.id)
    router.push('/chat')
  }
}

// 删除评论
const handleDeleteComment = (comment) => {
  if (confirm('确定要删除这条评论吗？')) {
    communityStore.deletePostComment(post.value.id, comment.id)
  }
}

// 预览图片
const previewImage = (url) => {
  previewImageUrl.value = url
  showImageModal.value = true
}

// 组件挂载
onMounted(() => {
  loadPost()
})
</script>

<style scoped>
.post-detail-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}

.post-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== 返回按钮 ===== */
.post-detail .n-button {
  align-self: flex-start;
}

/* ===== 帖子卡片 ===== */
.post-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;
}

.post-avatar:hover {
  opacity: 0.8;
}

.post-user {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.post-username {
  font-size: 15px;
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

.delete-btn {
  flex-shrink: 0;
}

.post-title {
  font-size: 24px;
  font-weight: 700;
  color: #212121;
  margin: 0 0 14px 0;
  line-height: 1.4;
}

.post-content p {
  font-size: 16px;
  color: #333;
  line-height: 1.8;
  margin: 0 0 14px 0;
  word-break: break-word;
}

.post-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.detail-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #e8e8e8;
  transition: transform 0.2s;
}

.detail-image:hover {
  transform: scale(1.02);
}

.post-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}

.post-actions .n-button {
  color: #666;
  font-size: 14px;
}

.post-actions .n-button:hover {
  color: #fb7299;
}

.action-divider {
  color: #ddd;
}

.action-comment-count {
  font-size: 14px;
  color: #999;
}

/* ===== 评论输入 ===== */
.comment-input-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.comment-input-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;
}

.comment-avatar:hover {
  opacity: 0.8;
}

.comment-avatar.placeholder {
  background: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}

.comment-tip {
  font-size: 13px;
  color: #999;
}

.comment-input-body {
  display: flex;
  gap: 10px;
  align-items: center;
}

.comment-input-body .n-input {
  flex: 1;
}

/* ===== 评论列表 ===== */
.comment-list {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.comment-item {
  display: flex;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-item .comment-avatar {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.comment-item .comment-avatar:hover {
  opacity: 0.8;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
  flex-wrap: wrap;
}

.comment-username {
  font-size: 13px;
  font-weight: 500;
  color: #212121;
  cursor: pointer;
  transition: color 0.2s;
}

.comment-username:hover {
  color: #fb7299;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-content {
  font-size: 14px;
  color: #333;
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

.empty-comments {
  background: #fff;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* ===== 加载状态 ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
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
  .post-detail-container {
    padding: 12px;
  }

  .post-card {
    padding: 16px;
  }

  .post-title {
    font-size: 20px;
  }

  .post-content p {
    font-size: 15px;
  }

  .comment-input-wrapper {
    padding: 12px 16px;
  }

  .comment-list {
    padding: 12px 16px;
  }

  .detail-image {
    max-height: 250px;
  }
}
</style>