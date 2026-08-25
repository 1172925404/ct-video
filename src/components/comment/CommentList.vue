<template>
  <div class="comment-list">
    <!-- 评论数量 -->
    <div class="comment-count">
      {{ commentCount }} 条评论
    </div>

    <!-- 评论输入 -->
    <CommentInput @submit="handleSubmitComment" />

    <!-- 评论列表 -->
    <div v-if="comments.length > 0" class="comments">
      <div 
        v-for="comment in comments" 
        :key="comment.id"
        class="comment-item"
      >
        <!-- 👇 修改：点击头像跳转到用户主页 -->
        <img 
          :src="comment.avatar" 
          class="comment-avatar" 
          @click="goToUser(comment.userId || comment.id)"
        />
        
        <!-- 内容 -->
        <div class="comment-body">
          <div class="comment-header">
            <!-- 👇 修改：点击名字跳转到用户主页 -->
            <span class="comment-author" @click="goToUser(comment.userId || comment.id)">
              {{ comment.username }}
            </span>
            <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
          </div>
          
          <p class="comment-content">{{ comment.content }}</p>
          
          <!-- 操作按钮 -->
          <div class="comment-actions">
            <n-button 
              size="small" 
              text 
              @click="handleLike(comment.id)"
            >
              <template #icon>
                <n-icon size="16">
                  <ThumbsUp v-if="comment.liked" />
                  <ThumbsUpOutline v-else />
                </n-icon>
              </template>
              {{ comment.likes > 0 ? comment.likes : '' }}
            </n-button>
            
            <n-button 
              v-if="canDelete(comment)"
              size="small" 
              text 
              type="error"
              @click="handleDelete(comment.id)"
            >
              <template #icon>
                <n-icon size="16"><TrashOutline /></n-icon>
              </template>
              删除
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-comments">
      <p>还没有评论，快来发表你的看法吧！</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon } from 'naive-ui'
import { 
  ThumbsUp, 
  ThumbsUpOutline,
  TrashOutline 
} from '@vicons/ionicons5'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import CommentInput from './CommentInput.vue'
import { useCommentStore } from '@/stores/comment'
import { useUserStore } from '@/stores/user'


dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps({
  videoId: {
    type: Number,
    required: true
  }
})

const router = useRouter()
const commentStore = useCommentStore()
const userStore = useUserStore()

// 评论列表
const comments = computed(() => {
  return commentStore.getCommentsByVideoId(props.videoId)
})

// 评论数量
const commentCount = computed(() => {
  return commentStore.getCommentCount(props.videoId)
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

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).fromNow()
}

// 判断是否可以删除（自己的评论）
const canDelete = (comment) => {
  const currentUser = userStore.user
  return currentUser && comment.username === currentUser.username
}

// 发表评论
const handleSubmitComment = (content) => {
  if (!content.trim()) return
  
  const currentUser = userStore.user
  commentStore.addComment(
    props.videoId,
    currentUser?.username || '匿名用户',
    content,
    currentUser?.avatar || 'https://picsum.photos/seed/anonymous/100'
  )
}

// 点赞评论
const handleLike = (commentId) => {
  commentStore.toggleCommentLike(props.videoId, commentId)
}

// 删除评论
const handleDelete = (commentId) => {
  if (confirm('确定要删除这条评论吗？')) {
    commentStore.deleteComment(props.videoId, commentId)
  }
}
</script>

<style scoped>
.comment-list {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
}

.comment-count {
  font-size: 16px;
  font-weight: 600;
  color: #212121;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.comments {
  margin-top: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;
}

.comment-avatar:hover {
  opacity: 0.8;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.comment-author {
  font-size: 14px;
  font-weight: 500;
  color: #212121;
  cursor: pointer;
  transition: color 0.2s;
}

.comment-author:hover {
  color: #fb7299;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin: 4px 0 8px 0;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.comment-actions .n-button {
  font-size: 13px;
  color: #999;
}

.comment-actions .n-button:hover {
  color: #666;
}

.empty-comments {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}
</style>