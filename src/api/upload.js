// src/api/upload.js
import { request } from './request'

// 根据环境设置 API 地址
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// 上传视频（支持进度回调）
export const uploadVideo = (formData, onProgress) => {
  const token = localStorage.getItem('token')

  console.log('📤 上传视频 - API_BASE_URL:', API_BASE_URL)  // 👈 调试日志
  console.log('📤 上传视频 - Token:', token ? '存在' : '不存在')  // 👈 调试日志

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    const url = `${API_BASE_URL}/upload/video`
    console.log('📤 请求地址:', url)  // 👈 调试日志

    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    // 上传进度
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          console.log('📤 上传进度:', percent, '%')  // 👈 调试日志
          onProgress(percent)
        }
      })
    }

    xhr.onload = () => {
      console.log('📤 响应状态:', xhr.status)  // 👈 调试日志
      console.log('📤 响应内容:', xhr.response)  // 👈 调试日志
      try {
        const data = JSON.parse(xhr.response)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data)
        } else {
          reject(new Error(data.message || '上传失败'))
        }
      } catch (error) {
        console.error('📤 解析响应失败:', error)  // 👈 调试日志
        reject(new Error('解析响应失败'))
      }
    }

    xhr.onerror = () => {
      console.error('📤 网络错误')  // 👈 调试日志
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
  const url = `${API_BASE_URL}/upload/thumbnail`
  console.log('📤 封面上传地址:', url)  // 👈 调试日志

  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  }).then(response => response.json())
}
