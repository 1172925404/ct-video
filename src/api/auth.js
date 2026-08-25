// src/api/auth.js
import { post, get } from './request'

// 注册
export const register = (username, password, email) => {
  return post('/auth/register', { username, password, email })
}

// 登录
export const login = (username, password) => {
  return post('/auth/login', { username, password })
}

// 验证 Token
export const verify = () => {
  return get('/auth/verify')
}

