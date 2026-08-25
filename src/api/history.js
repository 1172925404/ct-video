// src/api/history.js
import { get, post, del } from './request'

// 获取观看历史列表
export const getHistory = () => {
  return get('/history')
}

// 添加观看记录
export const addHistory = (videoId, progress = 0) => {
  return post(`/history/${videoId}`, { progress })
}

// 删除单条观看历史
export const removeHistory = (videoId) => {
  return del(`/history/${videoId}`)
}

// 清空所有观看历史
export const clearHistory = () => {
  return del('/history')
}