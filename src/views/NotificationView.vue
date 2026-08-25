<template>
    <div class="notification-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h1 class="page-title">🔔 消息通知</h1>
        <div class="header-actions">
          <n-button
            v-if="notifications.length > 0 && unreadCount > 0"
            size="small"
            text
            type="primary"
            @click="handleMarkAllRead"
          >
            全部已读
          </n-button>
        </div>
      </div>
  
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <n-spin size="small" />
        <span>加载中...</span>
      </div>
  
      <!-- 通知列表 -->
      <div v-else-if="notifications.length > 0" class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.isRead }"
          @click="handleNotificationClick(notification)"
        >
          <!-- 头像 -->
          <img
            v-if="notification.sender"
            :src="notification.sender.avatar"
            class="notification-avatar"
          />
          <div v-else class="notification-avatar system-avatar">📢</div>
  
          <!-- 内容 -->
          <div class="notification-body">
            <div class="notification-content">
              <span v-if="notification.sender" class="sender-name">
                {{ notification.sender.username }}
              </span>
              <span class="notification-text">{{ notification.content }}</span>
            </div>
            <div class="notification-time">
              {{ formatTime(notification.createdAt) }}
            </div>
          </div>
  
          <!-- 未读标记 -->
          <div v-if="!notification.isRead" class="unread-dot"></div>
        </div>
      </div>
  
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">🔔</div>
        <h3>暂无通知</h3>
        <p>当有人评论、点赞或关注你时，通知会显示在这里</p>
      </div>
  
      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination-wrapper">
        <n-pagination
          v-model:page="currentPage"
          :page-count="totalPages"
          :page-size="20"
          @update:page="handlePageChange"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { NButton, NSpin, NPagination } from 'naive-ui'
  import { useNotificationStore } from '@/stores/notification'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import 'dayjs/locale/zh-cn'
  
  dayjs.extend(relativeTime)
  dayjs.locale('zh-cn')
  
  const router = useRouter()
  const notificationStore = useNotificationStore()
  
  const currentPage = ref(1)
  
  // 计算属性
  const notifications = computed(() => notificationStore.notifications)
  const unreadCount = computed(() => notificationStore.unreadCount)
  const loading = computed(() => notificationStore.loading)
  const totalPages = computed(() => notificationStore.totalPages)
  
  // ===== 方法 =====
  const loadNotifications = async (page = 1) => {
    await notificationStore.loadNotifications(page)
  }
  
  const formatTime = (time) => {
    return dayjs(time).fromNow()
  }
  
  // 点击通知
  const handleNotificationClick = async (notification) => {
    // 标记为已读
    if (!notification.isRead) {
      await notificationStore.markAsReadById(notification.id)
    }
  
    // 跳转到对应页面
    if (notification.link) {
      router.push(notification.link)
    }
  }
  
  // 全部已读
  const handleMarkAllRead = async () => {
    await notificationStore.markAllAsReadById()
  }
  
  // 分页切换
  const handlePageChange = (page) => {
    currentPage.value = page
    loadNotifications(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // ===== 生命周期 =====
  onMounted(() => {
    loadNotifications()
  })
  
  // 离开页面时清除未读数量（不自动清除，但用户可能希望保持）
  </script>
  
  <style scoped>
  .notification-container {
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
  
  .header-actions {
    display: flex;
    gap: 8px;
  }
  
  /* ===== 通知列表 ===== */
  .notification-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .notification-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    background: #fff;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;
    position: relative;
  }
  
  .notification-item:hover {
    background: #f8f9fa;
  }
  
  .notification-item.unread {
    background: #fdf4f7;
  }
  
  .notification-item.unread:hover {
    background: #fce8ee;
  }
  
  .notification-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  
  .system-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }
  
  .notification-body {
    flex: 1;
    min-width: 0;
  }
  
  .notification-content {
    font-size: 14px;
    color: #333;
    line-height: 1.5;
  }
  
  .sender-name {
    font-weight: 600;
    color: #212121;
  }
  
  .notification-text {
    color: #555;
  }
  
  .notification-time {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
  }
  
  .unread-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fb7299;
    flex-shrink: 0;
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
  }
  
  /* ===== 分页 ===== */
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
  
  /* ===== 响应式 ===== */
  @media (max-width: 768px) {
    .notification-container {
      padding: 12px;
    }
  
    .notification-item {
      padding: 12px 14px;
    }
  
    .notification-avatar {
      width: 36px;
      height: 36px;
    }
  
    .system-avatar {
      width: 36px;
      height: 36px;
      font-size: 18px;
    }
  
    .notification-content {
      font-size: 13px;
    }
  }
  </style>