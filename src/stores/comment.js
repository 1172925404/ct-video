// src/stores/comment.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// 👇 新增：导入评论 API
import { getVideoComments, addComment as apiAddComment, deleteComment as apiDeleteComment, likeComment } from '@/api/comment'
import { useUserStore } from './user'

export const useCommentStore = defineStore('comment', () => {
  // ========== State ==========
  // 评论数据：按视频ID分组存储（本地缓存）
  const comments = ref({})

  // ========== 加载评论 ==========
  const loadComments = () => {
    const saved = localStorage.getItem('videoComments')
    if (saved) {
      try {
        comments.value = JSON.parse(saved)
      } catch (e) {
        comments.value = {}
      }
    } else {
      comments.value = {}
    }
  }

  // ========== 保存评论 ==========
  const saveComments = () => {
    localStorage.setItem('videoComments', JSON.stringify(comments.value))
  }

  // ============================================================
  // ========== 从后端获取某个视频的评论列表 ==========
  // ============================================================
  const fetchComments = async (videoId) => {
    try {
      const data = await getVideoComments(videoId)
      // 更新本地缓存
      const key = String(videoId)
      comments.value[key] = data.data || []
      // 同时保存到 localStorage（兼容旧逻辑）
      saveComments()
      return comments.value[key]
    } catch (error) {
      console.error('获取评论列表失败:', error)
      // 如果后端获取失败，尝试从 localStorage 读取
      const key = String(videoId)
      return comments.value[key] || []
    }
  }

  // ============================================================
  // ========== 获取某个视频的评论列表 ==========
  // ============================================================
  const getCommentsByVideoId = (videoId) => {
    const key = String(videoId)
    return comments.value[key] || []
  }

  // ============================================================
  // ========== 获取评论数量 ==========
  // ============================================================
  const getCommentCount = (videoId) => {
    const key = String(videoId)
    return (comments.value[key] || []).length
  }

  // ============================================================
  // ========== 发表评论（对接后端） ==========
  // ============================================================
  const addComment = async (videoId, username, content, avatar) => {
    if (!content || content.trim() === '') {
      throw new Error('评论内容不能为空')
    }

    // 调用后端 API 发表评论
    const data = await apiAddComment(videoId, content.trim())
    
    if (data.success) {
      // 将新评论添加到本地缓存
      const key = String(videoId)
      if (!comments.value[key]) {
        comments.value[key] = []
      }
      comments.value[key].unshift(data.data)
      saveComments()
      return data.data
    }
  }

  // ============================================================
  // ========== 删除评论（对接后端） ==========
  // ============================================================
  const deleteComment = async (videoId, commentId) => {
    // 调用后端 API 删除评论
    await apiDeleteComment(commentId)
    
    // 从本地缓存中移除
    const key = String(videoId)
    if (!comments.value[key]) return

    const index = comments.value[key].findIndex(c => c.id === commentId)
    if (index > -1) {
      comments.value[key].splice(index, 1)
      saveComments()
    }
  }

  // ============================================================
  // ========== 点赞评论（对接后端） ==========
  // ============================================================
  const toggleCommentLike = async (videoId, commentId) => {
    // 调用后端 API 点赞评论
    await likeComment(commentId)
    
    // 更新本地缓存
    const key = String(videoId)
    if (!comments.value[key]) return

    const comment = comments.value[key].find(c => c.id === commentId)
    if (comment) {
      comment.likes += comment.liked ? -1 : 1
      comment.liked = !comment.liked
      saveComments()
    }
  }

  // ============================================================
  // ========== 获取某个用户的所有评论 ==========
  // ============================================================
  const getCommentsByUsername = (username) => {
    if (!username) return []
    
    const result = []
    // 遍历所有视频的评论
    Object.keys(comments.value).forEach(videoId => {
      const commentList = comments.value[videoId] || []
      commentList.forEach(comment => {
        if (comment.username === username) {
          result.push({
            ...comment,
            videoId: Number(videoId)
          })
        }
      })
    })
    
    // 按时间倒序排列（最新的在前）
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  // ============================================================
  // ========== 获取某个用户评论的统计（仅数量） ==========
  // ============================================================
  const getCommentCountByUsername = (username) => {
    if (!username) return 0
    let count = 0
    Object.keys(comments.value).forEach(videoId => {
      const commentList = comments.value[videoId] || []
      count += commentList.filter(c => c.username === username).length
    })
    return count
  }

  // ========== 初始化 ==========
  loadComments()

  // ========== 导出 ==========
  return {
    comments,
    fetchComments,          // 新增：从后端获取评论
    getCommentsByVideoId,
    getCommentCount,
    addComment,
    deleteComment,
    toggleCommentLike,
    loadComments,
    getCommentsByUsername,
    getCommentCountByUsername,
  }
})