// src/api/stats.js
import { get } from './request'

// 获取用户统计数据（收藏数、历史数、评论数）
export const getUserStats = () => {
  return get('/users/me/stats')
}
