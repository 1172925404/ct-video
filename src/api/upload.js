// src/api/upload.js
import { request } from './request'

// 根据环境设置 API 地址
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// 上传视频（支持进度回调）
export const uploadVideo = (formData, onProgress) => {
  const token = localStorage.getItem('token')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // 👇 改用 API_BASE_URL
    xhr.open('POST', `${API_BASE_URL}/upload/video`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    // 上传进度
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          onProgress(percent)
        }
      })
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.response)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data)
        } else {
          reject(new Error(data.message || '上传失败'))
        }
      } catch (error) {
        reject(new Error('解析响应失败'))
      }
    }

    xhr.onerror = () => {
      reject(new Error('网络错误，请检查网络连接'))
    }

    xhr.send(formData)
  })
}

// 上传封面图
export const uploadThumbnail = (videoId, file) => {
  const formData = new FormData()
  formData.append('videoId', videoId)
  formData.append('thumbnail', file)

  const token = localStorage.getItem('token')

  // 👇 改用 API_BASE_URL
  return fetch(`${API_BASE_URL}/upload/thumbnail`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  }).then(response => response.json())
}