// src/api/request.js
// 根据环境设置 API 地址
// 本地开发：使用 localhost
// 生产环境：使用后端服务地址
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const request = async (url, options = {}) => {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '请求失败')
    }

    return data
  } catch (error) {
    console.error('API请求错误:', error)
    throw error
  }
}

export const get = (url, options) => request(url, { ...options, method: 'GET' })
export const post = (url, body, options) => request(url, { ...options, method: 'POST', body: JSON.stringify(body) })
export const put = (url, body, options) => request(url, { ...options, method: 'PUT', body: JSON.stringify(body) })
export const del = (url, options) => request(url, { ...options, method: 'DELETE' })