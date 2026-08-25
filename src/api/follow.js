// src/api/follow.js
import { get, post, del } from './request'

// 获取用户关注列表
export const getFollows = (userId) => {
  return get(`/follows/${userId}`)
}

// 获取用户粉丝列表
export const getFollowers = (userId) => {
  return get(`/follows/${userId}/followers`)
}

// 获取关注统计（关注数 + 粉丝数）
export const getFollowStats = (userId) => {
  return get(`/follows/stats/${userId}`)
}

// 检查是否已关注
export const checkFollow = (userId) => {
  return get(`/follows/check/${userId}`)
}

// 关注用户
export const followUser = (userId) => {
  return post(`/follows/${userId}`)
}

// 取消关注
export const unfollowUser = (userId) => {
  return del(`/follows/${userId}`)
}