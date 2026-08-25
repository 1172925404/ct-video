// src/api/user.js
import { get } from './request'

// 获取用户公开信息
export const getUserProfile = (userId) => {
  return get(`/users/${userId}`)
}

// 获取用户发布的视频列表
export const getUserVideos = (userId, page = 1, limit = 20) => {
  return get(`/users/${userId}/videos?page=${page}&limit=${limit}`)
}