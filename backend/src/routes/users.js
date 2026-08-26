// backend/src/routes/users.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// 获取用户公开信息
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)

    // 查询用户信息
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    // 获取统计数据
    const [followCount, followerCount, videoCount] = await Promise.all([
      prisma.follow.count({ where: { followerId: id } }),
      prisma.follow.count({ where: { followingId: id } }),
      prisma.video.count({ where: { authorId: id } })
    ])

    // 检查当前登录用户是否关注了此人
    let isFollowing = false
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
        const currentUserId = decoded.id

        if (currentUserId !== id) {
          const follow = await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: id
              }
            }
          })
          isFollowing = !!follow
        }
      } catch (e) {
        // Token 无效，忽略
      }
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
        followCount,
        followerCount,
        videoCount,
        isFollowing
      }
    })

  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 获取用户发布的视频列表
// ============================================================
router.get('/:id/videos', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { page = 1, limit = 20 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: { authorId: id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.video.count({ where: { authorId: id } })
    ])

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
      _liked: false,
      _favorited: false
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
    console.error('获取用户视频列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 👇 新增：获取当前用户统计数据
// ============================================================
router.get('/me/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    const [favoritesCount, historyCount, commentCount] = await Promise.all([
      prisma.favorite.count({ where: { userId } }),
      prisma.history.count({ where: { userId } }),
      prisma.comment.count({ where: { authorId: userId } })
    ])

    res.json({
      success: true,
      data: {
        favoritesCount,
        historyCount,
        commentCount
      }
    })

  } catch (error) {
    console.error('获取用户统计错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

module.exports = router
