// src/stores/video.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getVideos, 
  getVideoDetail, 
  toggleVideoLike, 
  toggleVideoFavorite, 
  recordView,
  getTags 
} from '@/api/video'
// 导入收藏 API
import { getFavorites, addFavorite, removeFavorite, checkFavorite } from '@/api/favorite'
// 👇 新增：导入历史 API
import { getHistory, addHistory, removeHistory, clearHistory as clearHistoryApi } from '@/api/history'

export const useVideoStore = defineStore('video', () => {
  // ========== State ==========
  const videos = ref([])  // 改为空数组，从后端获取
  const currentVideo = ref(null)
  const favorites = ref([])  // 存储收藏的视频ID列表
  const history = ref([])    // 存储历史的视频ID列表
  const allTags = ref([])
  const loading = ref(false)

  // ========== 加载视频列表 ==========
  const fetchVideos = async (params = {}) => {
    loading.value = true
    try {
      const data = await getVideos(params)
      // 兼容后端返回格式
      videos.value = data.data || data || []
      // 👇 确保 _liked 字段被正确保留（后端已返回）
      return videos.value
    } catch (error) {
      console.error('获取视频列表失败:', error)
      videos.value = []
      throw error
    } finally {
      loading.value = false
    }
  }

  // ========== 加载视频详情 ==========
  const fetchVideoDetail = async (id) => {
    try {
      const data = await getVideoDetail(id)
      const video = data.data || data
      currentVideo.value = video
      return video
    } catch (error) {
      console.error('获取视频详情失败:', error)
      throw error
    }
  }

  // ========== 加载标签 ==========
  const fetchTags = async () => {
    try {
      const data = await getTags()
      allTags.value = data.data || data || []
      return allTags.value
    } catch (error) {
      console.error('获取标签失败:', error)
      allTags.value = []
      return []
    }
  }

  // ============================================================
  // ========== 收藏功能（对接后端 API） ==========
  // ============================================================

  // 从后端加载收藏列表
  const loadFavorites = async () => {
    try {
      // 需要登录才能获取收藏
      const token = localStorage.getItem('token')
      if (!token) {
        favorites.value = []
        return
      }
      
      const data = await getFavorites()
      // 提取视频ID列表
      favorites.value = (data.data || []).map(v => v.id)
      
      // 👇 新增：将收藏的视频添加到 videos 列表中（如果还没有）
      if (data.data && data.data.length > 0) {
        data.data.forEach(video => {
          const exists = videos.value.some(v => v.id === video.id)
          if (!exists) {
            // 标记为已收藏
            video._favorited = true
            video._liked = video._liked || false
            videos.value.push(video)
          } else {
            // 如果已存在，更新 _favorited 状态
            const existing = videos.value.find(v => v.id === video.id)
            if (existing) {
              existing._favorited = true
            }
          }
        })
      }
      
      return favorites.value
    } catch (error) {
      console.error('加载收藏列表失败:', error)
      favorites.value = []
      return []
    }
  }

  // 检查是否已收藏
  const isFavorited = (videoId) => {
    return favorites.value.includes(videoId)
  }

  // 切换收藏状态
  const toggleFavorite = async (videoId) => {
    try {
      const isFav = isFavorited(videoId)
      
      if (isFav) {
        // 取消收藏
        await removeFavorite(videoId)
        const index = favorites.value.indexOf(videoId)
        if (index > -1) {
          favorites.value.splice(index, 1)
        }
        // 更新视频列表中的状态
        const video = getVideoById(videoId)
        if (video) {
          video._liked = false
          video._favorited = false
        }
        console.log('✅ 已取消收藏:', videoId)
      } else {
        // 添加收藏
        await addFavorite(videoId)
        favorites.value.push(videoId)
        // 更新视频列表中的状态
        const video = getVideoById(videoId)
        if (video) {
          video._liked = true
          video._favorited = true
        }
        console.log('✅ 已添加收藏:', videoId)
      }
    } catch (error) {
      // 如果错误是"已收藏"或"未收藏"，强制同步状态
      if (error.message === '已收藏' || error.message === '未收藏') {
        if (error.message === '已收藏') {
          // 后端说已收藏，但前端没记录
          if (!favorites.value.includes(videoId)) {
            favorites.value.push(videoId)
            const video = getVideoById(videoId)
            if (video) {
              video._liked = true
              video._favorited = true
            }
            console.log('🔄 强制同步：添加收藏', videoId)
          }
        } else {
          // 后端说未收藏，但前端记录了
          const index = favorites.value.indexOf(videoId)
          if (index > -1) {
            favorites.value.splice(index, 1)
            const video = getVideoById(videoId)
            if (video) {
              video._liked = false
              video._favorited = false
            }
            console.log('🔄 强制同步：取消收藏', videoId)
          }
        }
        return
      }
      console.error('收藏操作失败:', error)
      throw error
    }
  }

  // 获取收藏的视频列表（完整信息）
  const getFavoriteVideos = computed(() => {
    // 👇 从 videos 中过滤出已收藏的视频
    return videos.value.filter(v => favorites.value.includes(v.id))
  })

  // ============================================================
  // ========== 历史功能（对接后端 API） ==========
  // ============================================================

  // 从后端加载历史列表
  const loadHistory = async () => {
    try {
      // 需要登录才能获取历史
      const token = localStorage.getItem('token')
      if (!token) {
        history.value = []
        return
      }
      
      const data = await getHistory()
      // 提取视频ID列表
      history.value = (data.data || []).map(v => v.id)
      
      // 👇 新增：将历史的视频添加到 videos 列表中（如果还没有）
      if (data.data && data.data.length > 0) {
        data.data.forEach(video => {
          const exists = videos.value.some(v => v.id === video.id)
          if (!exists) {
            videos.value.push(video)
          }
        })
      }
      
      return history.value
    } catch (error) {
      console.error('加载历史列表失败:', error)
      history.value = []
      return []
    }
  }

  // 添加观看记录
  const addToHistory = async (videoId) => {
    try {
      // 调用后端 API 记录观看
      await addHistory(videoId)
      
      // 更新本地历史（将视频ID移到最前面）
      const index = history.value.indexOf(videoId)
      if (index > -1) {
        history.value.splice(index, 1)
      }
      history.value.unshift(videoId)
      // 最多保留50条
      if (history.value.length > 50) {
        history.value = history.value.slice(0, 50)
      }
    } catch (error) {
      console.error('记录观看失败:', error)
    }
  }

  // 清空所有观看历史
  const clearHistory = async () => {
    try {
      // 调用后端 API 清空历史
      await clearHistoryApi()
      history.value = []
    } catch (error) {
      console.error('清空历史失败:', error)
      throw error
    }
  }

  // 获取历史的视频列表（完整信息）
  const getHistoryVideos = computed(() => {
    return history.value
      .map(id => getVideoById(id))
      .filter(v => v !== undefined)
  })

  // ============================================================
  // ========== 分类筛选功能 ==========
  // ============================================================

  const getVideosByCategory = (category) => {
    switch (category) {
      case 'hot':
        return [...videos.value].sort((a, b) => b.views - a.views)
      case 'latest':
        return [...videos.value].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      case 'follow':
        return [...videos.value].sort(() => Math.random() - 0.5)
      case 'recommend':
      default:
        return videos.value
    }
  }

  // ============================================================
  // ========== 排序方法 ==========
  // ============================================================

  const getVideosWithSort = (category, sortBy) => {
    let result = getVideosByCategory(category)
    
    switch (sortBy) {
      case 'latest':
        return result
      case 'mostView':
        return [...result].sort((a, b) => b.views - a.views)
      case 'mostLike':
        return [...result].sort((a, b) => b.likes - a.likes)
      case 'oldest':
        return [...result].sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate))
      default:
        return result
    }
  }

  // ============================================================
  // ========== 标签相关方法 ==========
  // ============================================================

  const getAllTags = () => {
    return allTags.value.length > 0 ? allTags.value : getLocalTags()
  }

  const getLocalTags = () => {
    const tagSet = new Set()
    videos.value.forEach(video => {
      if (video.tags && Array.isArray(video.tags)) {
        video.tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }

  const getVideosByTag = (tag) => {
    if (!tag) return videos.value
    return videos.value.filter(video => 
      video.tags && video.tags.includes(tag)
    )
  }

  const getVideosWithFilters = (category, tag, sortBy) => {
    let result = getVideosByCategory(category)
    
    if (tag) {
      result = result.filter(video => video.tags && video.tags.includes(tag))
    }
    
    switch (sortBy) {
      case 'latest':
        return result
      case 'mostView':
        return [...result].sort((a, b) => b.views - a.views)
      case 'mostLike':
        return [...result].sort((a, b) => b.likes - a.likes)
      case 'oldest':
        return [...result].sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate))
      default:
        return result
    }
  }

  // ============================================================
  // ========== 搜索功能 ==========
  // ============================================================

  const searchVideos = (keyword) => {
    if (!keyword || keyword.trim() === '') {
      return videos.value
    }
    const searchTerm = keyword.trim().toLowerCase()
    return videos.value.filter(video => {
      return video.title.toLowerCase().includes(searchTerm) ||
             video.author.toLowerCase().includes(searchTerm)
    })
  }

  // ============================================================
  // ========== 视频基础功能 ==========
  // ============================================================

  const getVideoById = (id) => {
    return videos.value.find(v => v.id === Number(id))
  }

  const setCurrentVideo = async (id) => {
    try {
      // 先从已有数据中查找
      let video = getVideoById(id)
      if (video) {
        currentVideo.value = video
        return video
      }
      
      // 如果没有，从后端获取
      video = await fetchVideoDetail(id)
      if (video) {
        currentVideo.value = video
        // 同时添加到视频列表
        const exists = videos.value.some(v => v.id === video.id)
        if (!exists) {
          videos.value.push(video)
        }
      }
      return video
    } catch (error) {
      console.error('获取视频失败:', error)
      return null
    }
  }

  const toggleLike = async (videoId) => {
    try {
      const data = await toggleVideoLike(videoId)
      
      const video = getVideoById(videoId)
      if (video) {
        // 👇 使用后端返回的 liked 状态
        video.likes += video._liked ? -1 : 1
        video._liked = !video._liked
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      throw error
    }
  }

  // ============================================================
  // ========== 初始化 ==========
  // ============================================================

  const initLikedState = () => {
    videos.value.forEach(v => {
      v._liked = false
    })
  }

  // 注意：loadHistory 现在是异步的，需要在组件中调用
  // 初始化时不自动加载，由组件在 onMounted 中调用

  // ============================================================
  // ========== 导出 ==========
  // ============================================================

  return {
    // State
    videos,
    currentVideo,
    favorites,
    history,
    allTags,
    loading,
    // Getters
    getVideoById,
    getFavoriteVideos,
    getHistoryVideos,
    isFavorited,
    // Actions
    fetchVideos,
    fetchVideoDetail,
    fetchTags,
    loadFavorites,
    loadHistory,
    setCurrentVideo,
    toggleLike,
    toggleFavorite,
    addToHistory,
    clearHistory,
    getVideosByCategory,
    searchVideos,
    getVideosWithSort,
    getAllTags,
    getVideosByTag,
    getVideosWithFilters,
  }
})