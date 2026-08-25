// backend/src/routes/history.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// 获取当前用户的观看历史
// ============================================================
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    const histories = await prisma.history.findMany({
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
    const data = histories.map(h => ({
      id: h.video.id,
      title: h.video.title,
      description: h.video.description,
      cover: h.video.cover,
      url: h.video.url,
      views: h.video.views,
      likes: h.video.likes,
      duration: h.video.duration || '00:00',
      pubDate: h.video.createdAt,
      author: h.video.author.username,
      authorAvatar: h.video.author.avatar,
      tags: h.video.tags ? JSON.parse(h.video.tags) : [],
      _liked: false,
      progress: h.progress,
      watchedAt: h.createdAt
    }))

    res.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('获取历史列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 添加观看记录
// ============================================================
router.post('/:videoId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const videoId = parseInt(req.params.videoId)
    const { progress = 0 } = req.body

    // 检查视频是否存在
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    })
    if (!video) {
      return res.status(404).json({ message: '视频不存在' })
    }

    // 更新视频播放量
    await prisma.video.update({
      where: { id: videoId },
      data: { views: { increment: 1 } }
    })

    // 创建或更新观看历史
    await prisma.history.upsert({
      where: {
        userId_videoId: {
          userId,
          videoId
        }
      },
      update: {
        progress,
        createdAt: new Date()  // 更新时间，让历史记录排在前面
      },
      create: {
        userId,
        videoId,
        progress
      }
    })

    res.json({
      success: true,
      message: '记录成功'
    })

  } catch (error) {
    console.error('添加历史错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 删除单条观看历史
// ============================================================
router.delete('/:videoId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const videoId = parseInt(req.params.videoId)

    await prisma.history.delete({
      where: {
        userId_videoId: {
          userId,
          videoId
        }
      }
    })

    res.json({
      success: true,
      message: '已删除'
    })

  } catch (error) {
    console.error('删除历史错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 清空所有观看历史
// ============================================================
router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    await prisma.history.deleteMany({
      where: { userId }
    })

    res.json({
      success: true,
      message: '已清空'
    })

  } catch (error) {
    console.error('清空历史错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

module.exports = router