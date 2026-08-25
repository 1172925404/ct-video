// src/api/comment.js
import { get, post, del } from './request'

// 获取视频评论列表
export const getVideoComments = (videoId) => {
  return get(`/comments/video/${videoId}`)
}

// 发表评论
export const addComment = (videoId, content, parentId = null) => {
  return post('/comments', { videoId, content, parentId })
}

// 删除评论
export const deleteComment = (commentId) => {
  return del(`/comments/${commentId}`)
}

// 点赞评论
export const likeComment = (commentId) => {
  return post(`/comments/${commentId}/like`)
}