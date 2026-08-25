// src/api/video.js
import { get, post, put, del } from './request'

// 获取视频列表（支持分类、排序、标签、分页）
export const getVideos = (params = {}) => {
  const query = new URLSearchParams()
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      query.append(key, params[key])
    }
  })
  const url = `/videos${query.toString() ? '?' + query.toString() : ''}`
  return get(url)
}

// 获取视频详情
export const getVideoDetail = (id) => {
  return get(`/videos/${id}`)
}

// 点赞/取消点赞视频
export const toggleVideoLike = (id) => {
  return post(`/videos/${id}/like`)
}

// 收藏/取消收藏视频
export const toggleVideoFavorite = (id) => {
  return post(`/videos/${id}/favorite`)
}

// 记录观看
export const recordView = (id) => {
  return post(`/videos/${id}/view`)
}

// 获取所有标签
export const getTags = () => {
  return get('/videos/tags')
}

// 👇 新增：更新视频信息
export const updateVideo = (id, data) => {
  return put(`/videos/${id}`, data)
}

// 👇 新增：删除视频
export const deleteVideo = (id) => {
  return del(`/videos/${id}`)
}

// 👇 新增：上传封面图
export const uploadThumbnail = (videoId, file) => {
  const formData = new FormData()
  formData.append('videoId', videoId)
  formData.append('thumbnail', file)

  const token = localStorage.getItem('token')

  return fetch('http://localhost:3000/api/upload/thumbnail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  }).then(response => response.json())
}