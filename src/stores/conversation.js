// src/stores/conversation.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  getUnreadMessagesCount
} from '@/api/conversation'

export const useConversationStore = defineStore('conversation', () => {
  // ========== State ==========
  const conversations = ref([])       // 会话列表
  const currentConversation = ref(null)  // 当前会话
  const messages = ref([])            // 当前会话的消息
  const unreadCount = ref(0)          // 未读消息总数
  const loading = ref(false)

  // ========== Getters ==========
  const hasUnread = computed(() => unreadCount.value > 0)

  // ========== Actions ==========

  // 加载会话列表
  const loadConversations = async () => {
    try {
      const data = await getConversations()
      if (data.success) {
        conversations.value = data.data || []
        return conversations.value
      }
    } catch (error) {
      console.error('加载会话列表失败:', error)
      conversations.value = []
    }
    return []
  }

  // 获取或创建与某用户的会话
  const openConversation = async (userId) => {
    try {
      const data = await createConversation(userId)
      if (data.success) {
        // 加载会话消息
        await loadMessages(data.data.id)
        return data.data
      }
    } catch (error) {
      console.error('创建会话失败:', error)
      throw error
    }
  }

  // 加载会话消息
  const loadMessages = async (conversationId, page = 1) => {
    loading.value = true
    try {
      const data = await getMessages(conversationId, page)
      if (data.success) {
        currentConversation.value = data.data
        messages.value = data.data.messages || []
        return messages.value
      }
    } catch (error) {
      console.error('加载消息失败:', error)
      messages.value = []
    } finally {
      loading.value = false
    }
    return []
  }

  // 发送消息
  const sendMessageTo = async (conversationId, content) => {
    try {
      const data = await sendMessage(conversationId, content)
      if (data.success) {
        // 将新消息添加到列表
        messages.value.push(data.data)
        // 更新会话列表中的最后消息
        const conv = conversations.value.find(c => c.id === conversationId)
        if (conv) {
          conv.lastMessage = {
            id: data.data.id,
            content: data.data.content,
            senderId: data.data.senderId,
            createdAt: data.data.createdAt,
            isRead: false
          }
          conv.updatedAt = new Date()
          // 将会话移到列表顶部
          conversations.value.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        }
        return data.data
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }

  // 获取未读消息总数
  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadMessagesCount()
      if (data.success) {
        unreadCount.value = data.data.unreadCount || 0
        return unreadCount.value
      }
    } catch (error) {
      console.error('获取未读消息数失败:', error)
      unreadCount.value = 0
    }
    return 0
  }

  // 重置状态（登出时调用）
  const reset = () => {
    conversations.value = []
    currentConversation.value = null
    messages.value = []
    unreadCount.value = 0
  }

  return {
    // State
    conversations,
    currentConversation,
    messages,
    unreadCount,
    loading,
    // Getters
    hasUnread,
    // Actions
    loadConversations,
    openConversation,
    loadMessages,
    sendMessageTo,
    fetchUnreadCount,
    reset
  }
})
