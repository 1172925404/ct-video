// src/stores/notification.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/api/notification'

export const useNotificationStore = defineStore('notification', () => {
  // ========== State ==========
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const total = ref(0)
  const totalPages = ref(0)

  // ========== Getters ==========
  const hasUnread = computed(() => unreadCount.value > 0)

  // ========== Actions ==========
  // 加载通知列表
  const loadNotifications = async (page = 1, limit = 20) => {
    loading.value = true
    try {
      const data = await getNotifications(page, limit)
      if (data.success) {
        notifications.value = data.data || []
        total.value = data.pagination?.total || 0
        totalPages.value = data.pagination?.totalPages || 0
        return notifications.value
      }
    } catch (error) {
      console.error('加载通知列表失败:', error)
      notifications.value = []
    } finally {
      loading.value = false
    }
  }

  // 获取未读数量
  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount()
      if (data.success) {
        unreadCount.value = data.data.unreadCount || 0
        return unreadCount.value
      }
    } catch (error) {
      console.error('获取未读数量失败:', error)
      unreadCount.value = 0
    }
    return 0
  }

  // 标记单条为已读
  const markAsReadById = async (id) => {
    try {
      await markAsRead(id)
      // 更新本地状态
      const notification = notifications.value.find(n => n.id === id)
      if (notification) {
        notification.isRead = true
      }
      if (unreadCount.value > 0) {
        unreadCount.value -= 1
      }
      return true
    } catch (error) {
      console.error('标记已读失败:', error)
      return false
    }
  }

  // 全部已读
  const markAllAsReadById = async () => {
    try {
      await markAllAsRead()
      // 更新本地状态
      notifications.value.forEach(n => {
        n.isRead = true
      })
      unreadCount.value = 0
      return true
    } catch (error) {
      console.error('全部已读失败:', error)
      return false
    }
  }

  // 添加新通知（前端本地添加，用于实时更新）
  const addNotification = (notification) => {
    notifications.value.unshift(notification)
    unreadCount.value += 1
  }

  // 重置状态（登出时调用）
  const reset = () => {
    notifications.value = []
    unreadCount.value = 0
    loading.value = false
    total.value = 0
    totalPages.value = 0
  }

  return {
    // State
    notifications,
    unreadCount,
    loading,
    total,
    totalPages,
    // Getters
    hasUnread,
    // Actions
    loadNotifications,
    fetchUnreadCount,
    markAsReadById,
    markAllAsReadById,
    addNotification,
    reset
  }
})