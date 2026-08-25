// src/api/post.js
import { get, post, del } from './request'

// 根据环境设置 API 地址
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// 获取帖子列表
export const getPosts = () => {
  return get('/posts')
}

// 👇 新增：获取用户发布的帖子列表
export const getUserPosts = (userId) => {
  return get(`/posts/user/${userId}`)
}

// 获取帖子详情
export const getPostDetail = (postId) => {
  return get(`/posts/${postId}`)
}

// 👇 修改：发布帖子（支持 FormData 上传图片）
export const createPost = (title, content, images = []) => {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('content', content)
  
  images.forEach(image => {
    formData.append('images', image)
  })

  const token = localStorage.getItem('token')
  
  // 👇 改用 API_BASE_URL
  return fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  }).then(response => response.json())
}

// 删除帖子
export const deletePost = (postId) => {
  return del(`/posts/${postId}`)
}

// 点赞帖子
export const likePost = (postId) => {
  return post(`/posts/${postId}/like`)
}