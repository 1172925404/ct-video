// backend/src/routes/favorites.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// 获取当前用户的收藏列表
// ============================================================
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        video: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 转换数据格式
    const data = favorites.map(f => ({
      id: f.video.id,
      title: f.video.title,
      description: f.video.description,
      cover: f.video.cover,
      url: f.video.url,
      views: f.video.views,
      likes: f.video.likes,
      duration: f.video.duration || '00:00',
      pubDate: f.video.createdAt,
      author: f.video.author.username,
      authorAvatar: f.video.author.avatar,
      tags: f.video.tags ? JSON.parse(f.video.tags) : [],
      _liked: false,
      favoritedAt: f.createdAt
    }))

    res.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('获取收藏列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 检查是否已收藏
// ============================================================
router.get('/check/:videoId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const videoId = parseInt(req.params.videoId)

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId
        }
      }
    })

    res.json({
      success: true,
      isFavorited: !!existing
    })

  } catch (error) {
    console.error('检查收藏错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 添加收藏
// ============================================================
router.post('/:videoId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const videoId = parseInt(req.params.videoId)

    // 检查视频是否存在
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    })
    if (!video) {
      return res.status(404).json({ message: '视频不存在' })
    }

    // 检查是否已收藏
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId
        }
      }
    })

    if (existing) {
      return res.status(400).json({ message: '已收藏' })
    }

    // 创建收藏
    await prisma.favorite.create({
      data: {
        userId,
        videoId
      }
    })

    res.json({
      success: true,
      message: '收藏成功'
    })

  } catch (error) {
    console.error('添加收藏错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 取消收藏
// ============================================================
router.delete('/:videoId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const videoId = parseInt(req.params.videoId)

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId
        }
      }
    })

    if (!existing) {
      return res.status(404).json({ message: '未收藏' })
    }

    await prisma.favorite.delete({
      where: {
        userId_videoId: {
          userId,
          videoId
        }
      }
    })

    res.json({
      success: true,
      message: '已取消收藏'
    })

  } catch (error) {
    console.error('取消收藏错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

module.exports = router