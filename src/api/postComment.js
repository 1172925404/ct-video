// src/api/postComment.js
import { get, post, del } from './request'

// 获取帖子评论列表
export const getPostComments = (postId) => {
  return get(`/post-comments/post/${postId}`)
}

// 发表帖子评论
export const addPostComment = (postId, content) => {
  return post('/post-comments', { postId, content })
}

// 删除帖子评论
export const deletePostComment = (commentId) => {
  return del(`/post-comments/${commentId}`)
}