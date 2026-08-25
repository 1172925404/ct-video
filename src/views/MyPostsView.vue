<template>
    <div class="my-posts-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h1 class="page-title">📝 我发布的帖子</h1>
        <span class="post-total">共 {{ posts.length }} 个帖子</span>
      </div>
  
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <n-spin size="small" />
        <span>加载中...</span>
      </div>
  
      <!-- 帖子列表 -->
      <div v-else-if="posts.length > 0" class="post-list">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-item"
          @click="goToPost(post.id)"
        >
          <!-- 帖子头部 -->
          <div class="post-header">
            <img :src="post.avatar" class="post-avatar" />
            <div class="post-user">
              <span class="post-username">{{ post.author }}</span>
              <span class="post-time">{{ formatTime(post.createdAt) }}</span>
            </div>
          </div>
  
          <!-- 帖子标题 -->
          <h3 class="post-title">{{ post.title }}</h3>
  
          <!-- 帖子内容预览 -->
          <p class="post-preview">{{ getPreview(post.content) }}</p>
  
          <!-- 帖子统计 -->
          <div class="post-stats">
            <span class="stat-item">
              <n-icon size="16"><ThumbsUpOutline /></n-icon>
              {{ post.likes }}
            </span>
            <span class="stat-item">
              <n-icon size="16"><ChatbubbleOutline /></n-icon>
              {{ post.comments?.length || 0 }}
            </span>
          </div>
  
          <!-- 操作按钮 -->
          <div class="post-actions">
            <n-button size="small" type="error" @click.stop="handleDelete(post)">
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
        <div class="empty-icon">📝</div>
        <h3>还没有发布帖子</h3>
        <p>去聊天社区发布你的第一个帖子吧！</p>
        <n-button type="primary" @click="goToChat">去聊天社区</n-button>
      </div>
    </div>
</template>
  
<script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { NButton, NIcon, NSpin, useDialog, useMessage } from 'naive-ui'
  import { ThumbsUpOutline, ChatbubbleOutline, TrashOutline } from '@vicons/ionicons5'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import 'dayjs/locale/zh-cn'
  import { useUserStore } from '@/stores/user'
  import { useCommunityStore } from '@/stores/community'
  import { deletePost } from '@/api/post'
  
  dayjs.extend(relativeTime)
  dayjs.locale('zh-cn')
  
  const router = useRouter()
  const dialog = useDialog()
  const message = useMessage()
  const userStore = useUserStore()
  const communityStore = useCommunityStore()
  
  const posts = ref([])
  const loading = ref(false)
  
  // ===== 加载我发布的帖子 =====
  const loadMyPosts = async () => {
    const username = userStore.user?.username
    if (!username) {
      router.push('/')
      return
    }
  
    loading.value = true
    try {
      // 从 communityStore 中筛选当前用户的帖子
      const allPosts = communityStore.getAllPosts
      posts.value = allPosts.filter(p => p.author === username)
    } catch (error) {
      console.error('加载帖子失败:', error)
      message.error('加载帖子失败，请重试')
    } finally {
      loading.value = false
    }
  }
  
  // ===== 格式化时间 =====
  const formatTime = (time) => {
    return dayjs(time).fromNow()
  }
  
  // ===== 内容预览 =====
  const getPreview = (content) => {
    if (!content) return ''
    if (content.length <= 100) return content
    return content.slice(0, 100) + '...'
  }
  
  // ===== 跳转到帖子详情 =====
  const goToPost = (postId) => {
    router.push(`/post/${postId}`)
  }
  
  // ===== 跳转到聊天社区 =====
  const goToChat = () => {
    router.push('/chat')
  }
  
  // ===== 删除帖子 =====
  const handleDelete = (post) => {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除「${post.title}」吗？删除后无法恢复！`,
      positiveText: '确定删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await deletePost(post.id)
          // 从列表中移除
          const index = posts.value.findIndex(p => p.id === post.id)
          if (index > -1) {
            posts.value.splice(index, 1)
          }
          // 刷新社区数据
          await communityStore.fetchPosts()
          message.success('✅ 帖子已删除')
        } catch (error) {
          console.error('删除失败:', error)
          message.error(error.message || '删除失败，请重试')
        }
      }
    })
  }
  
  // ===== 组件挂载 =====
  onMounted(async () => {
    // 先确保帖子数据已加载
    if (communityStore.posts.length === 0) {
      await communityStore.fetchPosts()
    }
    loadMyPosts()
  })
</script>
  
<style scoped>
  .my-posts-container {
    max-width: 700px;
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
  
  .post-total {
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
  
  /* ===== 帖子列表 ===== */
  .post-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .post-item {
    background: #fff;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.3s;
    cursor: pointer;
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
  }
  
  .post-user {
    display: flex;
    flex-direction: column;
  }
  
  .post-username {
    font-size: 14px;
    font-weight: 500;
    color: #212121;
  }
  
  .post-time {
    font-size: 12px;
    color: #999;
  }
  
  /* 帖子标题 */
  .post-title {
    font-size: 17px;
    font-weight: 600;
    color: #212121;
    margin: 0 0 6px 0;
    line-height: 1.4;
  }
  
  /* 内容预览 */
  .post-preview {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin: 0 0 10px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* 帖子统计 */
  .post-stats {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: #999;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  /* 操作按钮 */
  .post-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
    padding-top: 10px;
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
    .my-posts-container {
      padding: 12px;
    }
  
    .post-item {
      padding: 14px 16px;
    }
  
    .post-title {
      font-size: 15px;
    }
  
    .post-preview {
      font-size: 13px;
    }
  }
</style>