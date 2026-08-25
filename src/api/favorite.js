// src/api/favorite.js
import { get, post, del } from './request'

// 获取收藏列表
export const getFavorites = () => {
  return get('/favorites')
}

// 检查是否已收藏
export const checkFavorite = (videoId) => {
  return get(`/favorites/check/${videoId}`)
}

// 添加收藏
export const addFavorite = (videoId) => {
  return post(`/favorites/${videoId}`)
}

// 取消收藏
export const removeFavorite = (videoId) => {
  return del(`/favorites/${videoId}`)
}