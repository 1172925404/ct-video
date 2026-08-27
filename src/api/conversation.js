// src/api/conversation.js
import { get, post } from './request'

// 获取会话列表
export const getConversations = () => {
  return get('/conversations')
}

// 获取或创建与某用户的会话
export const createConversation = (userId) => {
  return post(`/conversations/${userId}`)
}

// 获取会话详情（包含所有消息）
export const getMessages = (conversationId, page = 1, limit = 50) => {
  return get(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`)
}

// 发送消息
export const sendMessage = (conversationId, content) => {
  return post(`/conversations/${conversationId}/messages`, { content })
}

// 获取未读消息总数
export const getUnreadMessagesCount = () => {
  return get('/conversations/unread-count')
}
