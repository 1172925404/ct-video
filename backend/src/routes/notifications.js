// backend/src/routes/notifications.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// 获取当前用户的通知列表
// ============================================================
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        include: {
          sender: {
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
      prisma.notification.count({ where: { userId } })
    ])

    // 转换数据格式
    const formattedNotifications = notifications.map(n => ({
      id: n.id,
      type: n.type,
      content: n.content,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt,
      sender: n.sender ? {
        id: n.sender.id,
        username: n.sender.username,
        avatar: n.sender.avatar
      } : null
    }))

    res.json({
      success: true,
      data: formattedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('获取通知列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 获取未读通知数量
// ============================================================
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    })

    res.json({
      success: true,
      data: { unreadCount: count }
    })

  } catch (error) {
    console.error('获取未读数量错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 标记单条通知为已读
// ============================================================
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id

    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification) {
      return res.status(404).json({ message: '通知不存在' })
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: '无权操作此通知' })
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    })

    res.json({
      success: true,
      message: '已标记为已读'
    })

  } catch (error) {
    console.error('标记已读错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 标记所有通知为已读
// ============================================================
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    })

    res.json({
      success: true,
      message: '全部已读'
    })

  } catch (error) {
    console.error('全部已读错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 创建通知（工具函数，供其他路由调用）
// ============================================================
const createNotification = async (data) => {
  try {
    const { userId, type, content, link, senderId, targetId } = data
    
    // 不给自己发通知
    if (userId === senderId) return null

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        content,
        link,
        senderId,
        targetId
      }
    })

    return notification
  } catch (error) {
    console.error('创建通知错误:', error)
    return null
  }
}

module.exports = { router, createNotification }