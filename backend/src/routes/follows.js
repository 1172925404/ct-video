// backend/src/routes/follows.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// 获取用户关注列表
// ============================================================
router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)

    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const data = follows.map(f => ({
      id: f.following.id,
      username: f.following.username,
      avatar: f.following.avatar,
      bio: f.following.bio,
      followedAt: f.createdAt
    }))

    res.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('获取关注列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 获取用户粉丝列表
// ============================================================
router.get('/:userId/followers', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const data = followers.map(f => ({
      id: f.follower.id,
      username: f.follower.username,
      avatar: f.follower.avatar,
      bio: f.follower.bio,
      followedAt: f.createdAt
    }))

    res.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('获取粉丝列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 获取关注统计（关注数 + 粉丝数）
// ============================================================
router.get('/stats/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)

    const [followCount, followerCount] = await Promise.all([
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.follow.count({ where: { followingId: userId } })
    ])

    res.json({
      success: true,
      data: {
        followCount,
        followerCount
      }
    })

  } catch (error) {
    console.error('获取关注统计错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 检查是否已关注
// ============================================================
router.get('/check/:userId', authenticate, async (req, res) => {
  try {
    const followerId = req.user.id
    const followingId = parseInt(req.params.userId)

    // 不能关注自己
    if (followerId === followingId) {
      return res.json({ success: true, isFollowing: false })
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    })

    res.json({
      success: true,
      isFollowing: !!existing
    })

  } catch (error) {
    console.error('检查关注错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 关注用户
// ============================================================
router.post('/:userId', authenticate, async (req, res) => {
  try {
    const followerId = req.user.id
    const followingId = parseInt(req.params.userId)

    // 不能关注自己
    if (followerId === followingId) {
      return res.status(400).json({ message: '不能关注自己' })
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: followingId }
    })
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    // 检查是否已关注
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    })

    if (existing) {
      return res.status(400).json({ message: '已关注该用户' })
    }

    // 创建关注
    await prisma.follow.create({
      data: {
        followerId,
        followingId
      }
    })

    res.json({
      success: true,
      message: '关注成功'
    })

  } catch (error) {
    console.error('关注用户错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 取消关注
// ============================================================
router.delete('/:userId', authenticate, async (req, res) => {
  try {
    const followerId = req.user.id
    const followingId = parseInt(req.params.userId)

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    })

    if (!existing) {
      return res.status(404).json({ message: '未关注该用户' })
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    })

    res.json({
      success: true,
      message: '已取消关注'
    })

  } catch (error) {
    console.error('取消关注错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

module.exports = router