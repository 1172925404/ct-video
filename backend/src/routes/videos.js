// backend/src/routes/videos.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')
const path = require('path')  // 👈 新增
const fs = require('fs')      // 👈 新增

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// 获取视频列表（支持分类、排序、标签、分页）
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { category, sortBy, tag, page = 1, limit = 20 } = req.query

    // 构建查询条件
    const where = {}
    
    // 标签筛选
    if (tag) {
      where.tags = { contains: tag }
    }

    // 分类筛选（实际项目中分类可能是一个字段，这里用模拟）
    // 暂时不处理分类，后续可以扩展

    // 排序
    let orderBy = {}
    switch (sortBy) {
      case 'mostView':
        orderBy = { views: 'desc' }
        break
      case 'mostLike':
        orderBy = { likes: 'desc' }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // 查询视频
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      }),
      prisma.video.count({ where })
    ])

    // 👇 获取当前用户已点赞的视频ID列表（如果已登录）
    let userLikedVideoIds = []
    // 👇 新增：获取当前用户已收藏的视频ID列表
    let userFavoritedVideoIds = []
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
        const userId = decoded.id
        
        // 查询点赞
        const likes = await prisma.videoLike.findMany({
          where: { userId },
          select: { videoId: true }
        })
        userLikedVideoIds = likes.map(l => l.videoId)

        // 👇 新增：查询收藏
        const favorites = await prisma.favorite.findMany({
          where: { userId },
          select: { videoId: true }
        })
        userFavoritedVideoIds = favorites.map(f => f.videoId)
      } catch (e) {
        // Token 无效，忽略
      }
    }

    // 转换数据格式，匹配前端期望的字段
    const formattedVideos = videos.map(v => ({
      id: v.id,
      title: v.title,
      description: v.description,
      cover: v.cover,
      url: v.url,
      views: v.views,
      likes: v.likes,
      duration: v.duration || '00:00',
      pubDate: v.createdAt,
      author: v.author.username,
      authorAvatar: v.author.avatar,
      tags: v.tags ? JSON.parse(v.tags) : [],
      authorId: v.authorId,  // 👈 新增：作者ID，用于前端判断权限
      _liked: userLikedVideoIds.includes(v.id),           // 点赞状态
      _favorited: userFavoritedVideoIds.includes(v.id)    // 👈 新增：收藏状态
    }))

    res.json({
      success: true,
      data: formattedVideos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('获取视频列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 获取视频详情
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    if (!video) {
      return res.status(404).json({ message: '视频不存在' })
    }

    // 👇 获取当前用户是否已点赞
    let liked = false
    // 👇 新增：获取当前用户是否已收藏
    let favorited = false
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
        const userId = decoded.id
        
        // 查询点赞
        const like = await prisma.videoLike.findUnique({
          where: {
            userId_videoId: {
              userId,
              videoId: id
            }
          }
        })
        liked = !!like

        // 👇 新增：查询收藏
        const favorite = await prisma.favorite.findUnique({
          where: {
            userId_videoId: {
              userId,
              videoId: id
            }
          }
        })
        favorited = !!favorite
      } catch (e) {
        // Token 无效，忽略
      }
    }

    const formattedVideo = {
      id: video.id,
      title: video.title,
      description: video.description,
      cover: video.cover,
      url: video.url,
      views: video.views,
      likes: video.likes,
      duration: video.duration || '00:00',
      pubDate: video.createdAt,
      author: video.author.username,
      authorAvatar: video.author.avatar,
      tags: video.tags ? JSON.parse(video.tags) : [],
      authorId: video.authorId,  // 👈 新增：作者ID
      _liked: liked,                    // 点赞状态
      _favorited: favorited             // 👈 新增：收藏状态
    }

    res.json({
      success: true,
      data: formattedVideo
    })

  } catch (error) {
    console.error('获取视频详情错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 点赞/取消点赞视频（使用 VideoLike 表）
// ============================================================
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id

    // 检查视频是否存在
    const video = await prisma.video.findUnique({ where: { id } })
    if (!video) {
      return res.status(404).json({ message: '视频不存在' })
    }

    // 检查是否已点赞
    const existing = await prisma.videoLike.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId: id
        }
      }
    })

    // 👇 导入通知函数
    const { createNotification } = require('./notifications')

    if (existing) {
      // 取消点赞
      await prisma.videoLike.delete({
        where: {
          userId_videoId: {
            userId,
            videoId: id
          }
        }
      })
      // 点赞数 -1
      await prisma.video.update({
        where: { id },
        data: { likes: { decrement: 1 } }
      })
      res.json({ success: true, message: '已取消点赞', liked: false })
    } else {
      // 添加点赞
      await prisma.videoLike.create({
        data: {
          userId,
          videoId: id
        }
      })
      // 点赞数 +1
      await prisma.video.update({
        where: { id },
        data: { likes: { increment: 1 } }
      })

      // 👇 发送通知（不通知自己）
      if (userId !== video.authorId) {
        await createNotification({
          userId: video.authorId,
          type: 'like',
          content: `${req.user.username} 点赞了你的视频`,
          link: `/video/${id}`,
          senderId: userId,
          targetId: id
        })
      }

      res.json({ success: true, message: '点赞成功', liked: true })
    }

  } catch (error) {
    console.error('点赞操作错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 收藏/取消收藏视频
// ============================================================
router.post('/:id/favorite', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id

    const video = await prisma.video.findUnique({ where: { id } })
    if (!video) {
      return res.status(404).json({ message: '视频不存在' })
    }

    // 检查是否已收藏
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId: id
        }
      }
    })

    if (existing) {
      // 取消收藏
      await prisma.favorite.delete({
        where: { id: existing.id }
      })
      res.json({ success: true, message: '已取消收藏' })
    } else {
      // 添加收藏
      await prisma.favorite.create({
        data: {
          userId,
          videoId: id
        }
      })
      res.json({ success: true, message: '收藏成功' })
    }

  } catch (error) {
    console.error('收藏操作错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 记录观看（简化版，先不操作 History 表，因为表还没创建）
// ============================================================
router.post('/:id/view', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id
    const { progress = 0 } = req.body

    // 更新视频播放量（播放量 +1）
    await prisma.video.update({
      where: { id },
      data: { views: { increment: 1 } }
    })

    // TODO: 后续创建 History 表后，再记录观看历史
    // 目前暂时跳过 History 表的操作，避免 500 错误

    res.json({ success: true, message: '记录成功' })

  } catch (error) {
    console.error('记录观看错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 获取所有标签
// ============================================================
router.get('/tags/all', async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      select: { tags: true }
    })

    const tagSet = new Set()
    videos.forEach(v => {
      if (v.tags) {
        try {
          const tags = JSON.parse(v.tags)
          tags.forEach(t => tagSet.add(t))
        } catch (e) {}
      }
    })

    res.json({
      success: true,
      data: Array.from(tagSet).sort()
    })

  } catch (error) {
    console.error('获取标签错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 👇 新增：更新视频信息
// ============================================================
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id
    const { title, description, tags } = req.body

    // 检查视频是否存在
    const video = await prisma.video.findUnique({ where: { id } })
    if (!video) {
      return res.status(404).json({ message: '视频不存在' })
    }

    // 检查是否是作者
    if (video.authorId !== userId) {
      return res.status(403).json({ message: '无权修改此视频' })
    }

    // 验证标题
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: '标题不能为空' })
    }

    // 更新视频
    const updated = await prisma.video.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description || '',
        tags: tags ? JSON.stringify(tags) : '[]'
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    const formattedVideo = {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      cover: updated.cover,
      url: updated.url,
      views: updated.views,
      likes: updated.likes,
      duration: updated.duration || '00:00',
      pubDate: updated.createdAt,
      author: updated.author.username,
      authorAvatar: updated.author.avatar,
      tags: updated.tags ? JSON.parse(updated.tags) : [],
      authorId: updated.authorId
    }

    res.json({
      success: true,
      message: '更新成功',
      data: formattedVideo
    })

  } catch (error) {
    console.error('更新视频错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 👇 新增：删除视频
// ============================================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id

    // 检查视频是否存在
    const video = await prisma.video.findUnique({ where: { id } })
    if (!video) {
      return res.status(404).json({ message: '视频不存在' })
    }

    // 检查是否是作者
    if (video.authorId !== userId) {
      return res.status(403).json({ message: '无权删除此视频' })
    }

    // 删除关联数据
    await prisma.favorite.deleteMany({ where: { videoId: id } })
    await prisma.history.deleteMany({ where: { videoId: id } })
    await prisma.comment.deleteMany({ where: { videoId: id } })
    await prisma.videoLike.deleteMany({ where: { videoId: id } })

    // 删除视频文件
    if (video.url) {
      try {
        const filePath = path.join(__dirname, '../../uploads/videos', path.basename(video.url))
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (e) {
        console.error('删除视频文件错误:', e)
      }
    }

    // 删除封面图文件
    if (video.cover) {
      try {
        const coverPath = path.join(__dirname, '../../uploads/thumbnails', path.basename(video.cover))
        if (fs.existsSync(coverPath)) {
          fs.unlinkSync(coverPath)
        }
      } catch (e) {
        console.error('删除封面图文件错误:', e)
      }
    }

    // 删除视频记录
    await prisma.video.delete({ where: { id } })

    res.json({
      success: true,
      message: '视频已删除'
    })

  } catch (error) {
    console.error('删除视频错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

module.exports = router
