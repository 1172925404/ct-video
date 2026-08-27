<template>
  <div class="conversation-detail-container">
    <!-- 未选择会话 -->
    <div v-if="!currentConversation" class="no-conversation">
      <div class="no-conv-icon">👈</div>
      <p>选择一个会话开始聊天</p>
    </div>

    <!-- 已选择会话 -->
    <div v-else class="chat-content">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <n-button quaternary size="small" @click="goBack">
          <template #icon>
            <n-icon><ArrowBack /></n-icon>
          </template>
        </n-button>
        <img :src="currentConversation.otherUser.avatar" class="header-avatar" />
        <span class="header-name">{{ currentConversation.otherUser.username }}</span>
        <n-button size="small" quaternary @click="goToUserProfile">
          查看主页
        </n-button>
      </div>

      <!-- 消息列表 -->
      <div ref="messageListRef" class="message-list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="{ mine: msg.senderId === userStore.user?.id }"
        >
          <img
            v-if="msg.senderId !== userStore.user?.id"
            :src="currentConversation.otherUser.avatar"
            class="msg-avatar"
          />
          <div class="message-bubble">
            <span class="message-content">{{ msg.content }}</span>
            <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
          </div>
          <img
            v-if="msg.senderId === userStore.user?.id"
            :src="userStore.getUserAvatar"
            class="msg-avatar mine-avatar"
          />
        </div>
        <div v-if="loading" class="loading-messages">
          <n-spin size="small" />
        </div>
      </div>

      <!-- 消息输入框 -->
      <div class="message-input">
        <n-input
          v-model:value="messageInput"
          placeholder="输入消息..."
          @keyup.enter="handleSend"
        />
        <n-button type="primary" @click="handleSend">
          发送
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'  // 👈 添加 watch
import { useRoute, useRouter } from 'vue-router'
import { NButton, NIcon, NInput, NSpin } from 'naive-ui'
import { ArrowBack } from '@vicons/ionicons5'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { useConversationStore } from '@/stores/conversation'
import { useUserStore } from '@/stores/user'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()
const conversationStore = useConversationStore()
const userStore = useUserStore()

const messageInput = ref('')
const messageListRef = ref(null)

const currentConversation = computed(() => conversationStore.currentConversation)
const messages = computed(() => conversationStore.messages)
const loading = computed(() => conversationStore.loading)

// 👇 修改：使用路由参数获取会话ID
const getConversationId = () => {
  return Number(route.params.id)
}

// 加载会话消息
const loadMessages = async () => {
  const conversationId = getConversationId()
  if (isNaN(conversationId)) {
    router.push('/conversations')
    return
  }
  await conversationStore.loadMessages(conversationId)
  scrollToBottom()
}

// 发送消息
const handleSend = async () => {
  const content = messageInput.value.trim()
  if (!content) return

  // 👇 修改：使用路由参数获取会话ID，而不是 currentConversation.value.id
  const conversationId = getConversationId()
  if (isNaN(conversationId)) {
    console.error('无效的会话ID:', route.params.id)
    return
  }

  try {
    await conversationStore.sendMessageTo(conversationId, content)
    messageInput.value = ''
    scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
  }
}

// 返回
const goBack = () => {
  router.push('/conversations')
}

// 查看用户主页
const goToUserProfile = () => {
  const userId = currentConversation.value.otherUser.id
  router.push(`/user/${userId}`)
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).fromNow()
}

// 👇 新增：监听路由参数变化
watch(
  () => route.params.id,
  () => {
    loadMessages()
  }
)

// 组件挂载
onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.conversation-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.header-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.header-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #212121;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f9fa;
}

.message-item {
  display: flex;
  gap: 8px;
  max-width: 70%;
  align-self: flex-start;
}

.message-item.mine {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.mine-avatar {
  order: 2;
}

.message-bubble {
  background: #fff;
  border-radius: 12px;
  padding: 10px 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-item.mine .message-bubble {
  background: #fb7299;
  color: #fff;
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
  display: block;
  word-break: break-word;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  display: block;
}

.message-item.mine .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.loading-messages {
  text-align: center;
  padding: 10px;
}

.message-input {
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #f0f0f0;
}

.message-input .n-input {
  flex: 1;
}

.no-conversation {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.no-conv-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .conversation-detail-container {
    padding: 12px;
  }

  .message-item {
    max-width: 85%;
  }
}
</style>
