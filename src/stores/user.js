// src/stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister, verify as apiVerify } from '@/api/auth'
// 👇 新增：导入关注 API
import { getFollows, getFollowers, getFollowStats, checkFollow, followUser as apiFollowUser, unfollowUser as apiUnfollowUser } from '@/api/follow'

export const useUserStore = defineStore('user', () => {
  // 📦 State
  const user = ref(null)
  const token = ref(null)
  const isLoggedIn = ref(false)
  const userList = ref([])

  // 👇 新增：关注相关状态
  const followList = ref([])      // 关注列表
  const followerList = ref([])    // 粉丝列表
  const followCount = ref(0)      // 关注数
  const followerCount = ref(0)    // 粉丝数

  // 🔧 加载用户列表
  const loadUserList = () => {
    const saved = localStorage.getItem('userList')
    if (saved) {
      try {
        userList.value = JSON.parse(saved)
      } catch (e) {
        userList.value = []
      }
    } else {
      userList.value = []
    }
  }

  // 🔧 保存用户列表
  const saveUserList = () => {
    localStorage.setItem('userList', JSON.stringify(userList.value))
  }

  // ============================================================
  // 🔧 注册（对接后端 API）
  // ============================================================
  const register = async (username, password, email) => {
    try {
      const data = await apiRegister(username, password, email)
      if (data.success) {
        user.value = data.user
        token.value = data.token
        isLoggedIn.value = true
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        return data.user
      }
    } catch (error) {
      throw new Error(error.message || '注册失败，请重试')
    }
  }

  // ============================================================
  // 🔧 登录（对接后端 API）
  // ============================================================
  const login = async (username, password) => {
    try {
      const data = await apiLogin(username, password)
      if (data.success) {
        user.value = data.user
        token.value = data.token
        isLoggedIn.value = true
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        return data.user
      }
    } catch (error) {
      throw new Error(error.message || '登录失败，请重试')
    }
  }

  // ============================================================
  // 🔧 恢复登录状态（从后端验证 Token）
  // ============================================================
  const restoreLoginState = async () => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')

    if (savedUser && savedToken) {
      try {
        const data = await apiVerify()
        if (data.success) {
          user.value = JSON.parse(savedUser)
          token.value = savedToken
          isLoggedIn.value = true
          return true
        }
      } catch (error) {
        console.log('Token已过期，请重新登录')
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    return false
  }

  // 🔧 登出
  const logout = () => {
    user.value = null
    token.value = null
    isLoggedIn.value = false
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  // ========== 获取用户统计数据（直接从 localStorage 计算） ==========
  const getUserStats = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    const history = JSON.parse(localStorage.getItem('videoHistory') || '[]')
    
    let commentCount = 0
    const currentUsername = user.value?.username
    if (currentUsername) {
      const allComments = JSON.parse(localStorage.getItem('videoComments') || '{}')
      Object.keys(allComments).forEach(videoId => {
        const comments = allComments[videoId] || []
        commentCount += comments.filter(c => c.username === currentUsername).length
      })
    }
    
    return {
      favoritesCount: favorites.length,
      historyCount: history.length,
      commentCount: commentCount
    }
  }

  // ========== 更新用户信息 ==========
  const updateUserProfile = (updates) => {
    if (!user.value) {
      throw new Error('用户未登录')
    }

    const oldUsername = user.value.username
    user.value = {
      ...user.value,
      ...updates
    }

    localStorage.setItem('user', JSON.stringify(user.value))

    loadUserList()
    const index = userList.value.findIndex(u => u.id === user.value.id)
    if (index > -1) {
      userList.value[index] = {
        ...userList.value[index],
        ...updates
      }
      saveUserList()
    }

    if (oldUsername !== user.value.username) {
      updateCommentsUsername(oldUsername, user.value.username)
    }

    return user.value
  }

  // ========== 更新评论中的用户名 ==========
  const updateCommentsUsername = (oldUsername, newUsername) => {
    const allComments = JSON.parse(localStorage.getItem('videoComments') || '{}')
    let changed = false

    Object.keys(allComments).forEach(videoId => {
      const comments = allComments[videoId] || []
      comments.forEach(comment => {
        if (comment.username === oldUsername) {
          comment.username = newUsername
          changed = true
        }
      })
    })

    if (changed) {
      localStorage.setItem('videoComments', JSON.stringify(allComments))
    }
  }

  // ============================================================
  // ========== 关注相关方法 ==========
  // ============================================================

  // 加载关注列表
  const loadFollows = async (userId) => {
    try {
      const data = await getFollows(userId)
      followList.value = data.data || []
      return followList.value
    } catch (error) {
      console.error('加载关注列表失败:', error)
      followList.value = []
      return []
    }
  }

  // 加载粉丝列表
  const loadFollowers = async (userId) => {
    try {
      const data = await getFollowers(userId)
      followerList.value = data.data || []
      return followerList.value
    } catch (error) {
      console.error('加载粉丝列表失败:', error)
      followerList.value = []
      return []
    }
  }

  // 加载关注统计（关注数 + 粉丝数）
  const loadFollowStats = async (userId) => {
    try {
      const data = await getFollowStats(userId)
      if (data.success) {
        followCount.value = data.data.followCount || 0
        followerCount.value = data.data.followerCount || 0
        return data.data
      }
    } catch (error) {
      console.error('加载关注统计失败:', error)
      followCount.value = 0
      followerCount.value = 0
    }
    return { followCount: 0, followerCount: 0 }
  }

  // 检查是否已关注
  const checkIsFollowing = async (userId) => {
    try {
      if (!user.value) return false
      const data = await checkFollow(userId)
      return data.isFollowing || false
    } catch (error) {
      console.error('检查关注状态失败:', error)
      return false
    }
  }

  // 关注用户
  const followUser = async (userId) => {
    try {
      await apiFollowUser(userId)
      // 更新关注数
      followCount.value += 1
      // 如果关注列表已加载，添加用户
      // 不需要额外操作，上层组件会刷新
    } catch (error) {
      throw new Error(error.message || '关注失败，请重试')
    }
  }

  // 取消关注
  const unfollowUser = async (userId) => {
    try {
      await apiUnfollowUser(userId)
      // 更新关注数
      followCount.value -= 1
      if (followCount.value < 0) followCount.value = 0
    } catch (error) {
      throw new Error(error.message || '取消关注失败，请重试')
    }
  }

  // 初始化
  loadUserList()

  return {
    user,
    token,
    isLoggedIn,
    followList,
    followerList,
    followCount,
    followerCount,
    getUserInfo: computed(() => user.value),
    getIsLoggedIn: computed(() => isLoggedIn.value),
    getUserAvatar: computed(() => user.value?.avatar || 'https://picsum.photos/200'),
    getUserName: computed(() => user.value?.username || '未登录'),
    login,
    register,
    logout,
    restoreLoginState,
    getUserStats,
    updateUserProfile,
    // 关注相关
    loadFollows,
    loadFollowers,
    loadFollowStats,
    checkIsFollowing,
    followUser,
    unfollowUser,
  }
})