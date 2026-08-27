<template>
    <div class="conversation-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h1 class="page-title">💬 私信</h1>
      </div>
  
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <n-spin size="small" />
        <span>加载中...</span>
      </div>
  
      <!-- 会话列表 -->
      <div v-else-if="conversations.length > 0" class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conversation-item"
          @click="goToConversation(conv.id)"
        >
          <img :src="conv.otherUser.avatar" class="conv-avatar" />
          <div class="conv-info">
            <div class="conv-name-row">
              <span class="conv-name">{{ conv.otherUser.username }}</span>
              <span v-if="conv.lastMessage" class="conv-time">
                {{ formatTime(conv.lastMessage.createdAt) }}
              </span>
            </div>
            <div class="conv-last-message">
              <span v-if="conv.lastMessage" class="message-preview">
                {{ conv.lastMessage.senderId === userStore.user?.id ? '我: ' : '' }}
                {{ truncate(conv.lastMessage.content, 20) }}
              </span>
              <span v-else class="message-preview">开始聊天吧</span>
            </div>
          </div>
          <span v-if="conv.unreadCount > 0" class="unread-badge">
            {{ conv.unreadCount }}
          </span>
        </div>
      </div>
  
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>还没有私信</h3>
        <p>去用户主页点击"发私信"开始聊天</p>
        <n-button type="primary" @click="goHome">去首页</n-button>
      </div>
    </div>
</template>
  
<script setup>
  import { computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { NButton, NSpin } from 'naive-ui'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import 'dayjs/locale/zh-cn'
  import { useConversationStore } from '@/stores/conversation'
  import { useUserStore } from '@/stores/user'
  
  dayjs.extend(relativeTime)
  dayjs.locale('zh-cn')
  
  const router = useRouter()
  const conversationStore = useConversationStore()
  const userStore = useUserStore()
  
  const conversations = computed(() => conversationStore.conversations)
  const loading = computed(() => conversationStore.loading)
  
  // 加载会话列表
  const loadConversations = async () => {
    await conversationStore.loadConversations()
  }
  
  // 跳转到会话详情
  const goToConversation = (conversationId) => {
    router.push(`/conversations/${conversationId}`)
  }
  
  // 返回首页
  const goHome = () => {
    router.push('/')
  }
  
  // 格式化时间
  const formatTime = (time) => {
    return dayjs(time).fromNow()
  }
  
  // 截断文本
  const truncate = (text, length) => {
    if (!text) return ''
    return text.length > length ? text.slice(0, length) + '...' : text
  }
  
  // 组件挂载
  onMounted(() => {
    loadConversations()
  })
</script>
  
<style scoped>
  .conversation-container {
    max-width: 700px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: #212121;
    margin: 0;
  }
  
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 0;
    color: #999;
    font-size: 14px;
  }
  
  .conversation-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .conversation-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    background: #fff;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
  
  .conversation-item:hover {
    background: #f8f9fa;
  }
  
  .conv-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  
  .conv-info {
    flex: 1;
    min-width: 0;
  }
  
  .conv-name-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }
  
  .conv-name {
    font-size: 14px;
    font-weight: 500;
    color: #212121;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .conv-time {
    font-size: 11px;
    color: #999;
    flex-shrink: 0;
  }
  
  .conv-last-message {
    font-size: 13px;
    color: #999;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .message-preview {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .unread-badge {
    background: #fb7299;
    color: #fff;
    min-width: 20px;
    height: 20px;
    border-radius: 10px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    flex-shrink: 0;
  }
  
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
  
  @media (max-width: 768px) {
    .conversation-container {
      padding: 12px;
    }
  
    .conversation-item {
      padding: 12px 14px;
    }
  }
</style>
