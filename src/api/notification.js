// src/api/notification.js
import { get, put } from './request'

// 获取通知列表
export const getNotifications = (page = 1, limit = 20) => {
  return get(`/notifications?page=${page}&limit=${limit}`)
}

// 获取未读通知数量
export const getUnreadCount = () => {
  return get('/notifications/unread-count')
}

// 标记单条通知为已读
export const markAsRead = (id) => {
  return put(`/notifications/${id}/read`)
}

// 标记所有通知为已读
export const markAllAsRead = () => {
  return put('/notifications/read-all')
}