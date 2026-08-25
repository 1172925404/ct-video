// src/stores/community.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// 👇 新增：导入帖子 API
import { getPosts, getPostDetail, createPost as apiCreatePost, deletePost as apiDeletePost, likePost } from '@/api/post'
// 👇 新增：导入帖子评论 API
import { getPostComments, addPostComment as apiAddPostComment, deletePostComment as apiDeletePostComment } from '@/api/postComment'
import { useUserStore } from './user'

export const useCommunityStore = defineStore('community', () => {
  // ========== State ==========
  const posts = ref([])

  // ========== 加载帖子 ==========
  const loadPosts = () => {
    const saved = localStorage.getItem('communityPosts')
    if (saved) {
      try {
        posts.value = JSON.parse(saved)
      } catch (e) {
        posts.value = []
      }
    } else {
      posts.value = getDefaultPosts()
      savePosts()
    }
  }

  // ========== 保存帖子 ==========
  const savePosts = () => {
    localStorage.setItem('communityPosts', JSON.stringify(posts.value))
  }

  // ========== 获取默认帖子 ==========
  const getDefaultPosts = () => {
    return [
      {
        id: 1,
        title: '🎉 个人中心页面完工了！',
        content: '花了两天时间，终于把个人中心页面做完了！支持编辑头像、昵称、邮箱和个人简介，所有数据都会同步更新到评论中。大家快来体验一下吧！有什么建议欢迎提出~',
        author: '前端阿杰',
        avatar: 'https://picsum.photos/seed/user2/100',
        images: [],
        likes: 5,
        liked: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        comments: [
          {
            id: 101,
            author: '编程小白学堂',
            avatar: 'https://picsum.photos/seed/user1/100',
            content: '太棒了！我也去试试！',
            createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
          }
        ]
      },
      {
        id: 2,
        title: 'Vue 3 组合式 API 真香！',
        content: '最近在项目中全面使用 Vue 3 的组合式 API，配合 TypeScript 用起来真的太舒服了。代码组织更加清晰，逻辑复用也更加方便。大家现在都在用组合式 API 还是 Options API？',
        author: '技术胖哥',
        avatar: 'https://picsum.photos/seed/user5/100',
        images: [],
        likes: 3,
        liked: false,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        comments: [
          {
            id: 102,
            author: 'TS狂热者',
            avatar: 'https://picsum.photos/seed/user7/100',
            content: '确实！特别是配合 TypeScript 用起来太舒服了',
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
          }
        ]
      },
      {
        id: 3,
        title: '🎨 暗色主题设计方案分享',
        content: '最近在设计一套暗色主题方案，采用了低饱和度配色，减少视觉疲劳。主色用了 #1a1a2e 搭配 #16213e，辅以金色 #f6c90e 作为点缀。大家觉得这个方案怎么样？有没有更好的建议？',
        author: 'UI设计师小美',
        avatar: 'https://picsum.photos/seed/user4/100',
        images: [],
        likes: 8,
        liked: false,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        comments: []
      }
    ]
  }

  // ============================================================
  // ========== 从后端获取帖子列表 ==========
  // ============================================================
  const fetchPosts = async () => {
    try {
      const data = await getPosts()
      posts.value = data.data || []
      // 同时保存到 localStorage（兼容旧逻辑）
      savePosts()
      return posts.value
    } catch (error) {
      console.error('获取帖子列表失败:', error)
      // 如果后端获取失败，尝试从 localStorage 读取
      loadPosts()
      return posts.value
    }
  }

  // ============================================================
  // ========== 从后端获取帖子详情 ==========
  // ============================================================
  const fetchPostDetail = async (postId) => {
    try {
      const data = await getPostDetail(postId)
      // 更新本地缓存
      const index = posts.value.findIndex(p => p.id === Number(postId))
      if (index > -1) {
        posts.value[index] = data.data
      } else {
        posts.value.push(data.data)
      }
      savePosts()
      return data.data
    } catch (error) {
      console.error('获取帖子详情失败:', error)
      return getPostById(postId)
    }
  }

  // ============================================================
  // ========== 获取所有帖子（按时间倒序） ==========
  // ============================================================
  const getAllPosts = computed(() => {
    return [...posts.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })

  // ============================================================
  // ========== 根据ID获取帖子 ==========
  // ============================================================
  const getPostById = (id) => {
    return posts.value.find(p => p.id === Number(id))
  }

  // ============================================================
  // ========== 发布帖子（对接后端） ==========
  // ============================================================
  const createPost = async (author, avatar, title, content, images = []) => {
    if (!title || title.trim() === '') {
      throw new Error('标题不能为空')
    }
    if (!content || content.trim() === '') {
      throw new Error('内容不能为空')
    }

    // 调用后端 API 发布帖子
    const data = await apiCreatePost(title.trim(), content.trim(), images)
    
    if (data.success) {
      // 将新帖子添加到本地缓存
      posts.value.unshift(data.data)
      savePosts()
      return data.data
    }
  }

  // ============================================================
  // ========== 点赞/取消点赞（对接后端） ==========
  // ============================================================
  const togglePostLike = async (postId) => {
    const post = getPostById(postId)
    if (!post) return

    // 调用后端 API 点赞帖子
    await likePost(postId)
    
    // 更新本地缓存
    post.likes += post.liked ? -1 : 1
    post.liked = !post.liked
    savePosts()
  }

  // ============================================================
  // ========== 评论帖子（对接后端） ==========
  // ============================================================
  const addPostComment = async (postId, author, avatar, content) => {
    if (!content || content.trim() === '') {
      throw new Error('评论内容不能为空')
    }

    const post = getPostById(postId)
    if (!post) {
      throw new Error('帖子不存在')
    }

    // 调用后端 API 发表评论
    const data = await apiAddPostComment(postId, content.trim())
    
    if (data.success) {
      // 将新评论添加到本地缓存
      const newComment = {
        id: data.data.id,
        author: data.data.author,
        avatar: data.data.avatar,
        content: data.data.content,
        createdAt: data.data.createdAt
      }
      post.comments.unshift(newComment)
      savePosts()
      return newComment
    }
  }

  // ============================================================
  // ========== 删除帖子（对接后端） ==========
  // ============================================================
  const deletePost = async (postId) => {
    // 调用后端 API 删除帖子
    await apiDeletePost(postId)
    
    // 从本地缓存移除
    const index = posts.value.findIndex(p => p.id === Number(postId))
    if (index > -1) {
      posts.value.splice(index, 1)
      savePosts()
      return true
    }
    return false
  }

  // ============================================================
  // ========== 删除评论（对接后端） ==========
  // ============================================================
  const deletePostComment = async (postId, commentId) => {
    const post = getPostById(postId)
    if (!post) return false

    // 调用后端 API 删除评论
    await apiDeletePostComment(commentId)
    
    // 从本地缓存移除
    const index = post.comments.findIndex(c => c.id === commentId)
    if (index > -1) {
      post.comments.splice(index, 1)
      savePosts()
      return true
    }
    return false
  }

  // ========== 初始化 ==========
  loadPosts()

  // ========== 导出 ==========
  return {
    posts,
    fetchPosts,           // 新增：从后端获取帖子列表
    fetchPostDetail,      // 新增：从后端获取帖子详情
    getAllPosts,
    getPostById,
    createPost,
    togglePostLike,
    addPostComment,
    deletePost,
    deletePostComment,
    loadPosts
  }
})