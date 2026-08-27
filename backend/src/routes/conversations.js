// backend/src/routes/conversations.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// 获取会话列表（当前用户的所有私信会话）
// ============================================================
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: { id: true, username: true, avatar: true }
        },
        user2: {
          select: { id: true, username: true, avatar: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1  // 只取最新一条消息
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // 格式化数据
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1
      const lastMessage = conv.messages[0] || null
      const unreadCount = conv.messages.filter(m => 
        m.senderId !== userId && !m.isRead
      ).length

      return {
        id: conv.id,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          avatar: otherUser.avatar
        },
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
          isRead: lastMessage.isRead
        } : null,
        unreadCount,
        updatedAt: conv.updatedAt
      }
    })

    res.json({
      success: true,
      data: formattedConversations
    })

  } catch (error) {
    console.error('获取会话列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 获取或创建与某用户的会话
// ============================================================
router.post('/:userId', authenticate, async (req, res) => {
  try {
    const currentUserId = req.user.id
    const otherUserId = parseInt(req.params.userId)

    // 不能和自己聊天
    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: '不能与自己创建会话' })
    }

    // 检查用户是否存在
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId }
    })
    if (!otherUser) {
      return res.status(404).json({ message: '用户不存在' })
    }

    // 查找现有会话（保证 user1Id < user2Id 以便唯一索引生效）
    const user1Id = Math.min(currentUserId, otherUserId)
    const user2Id = Math.max(currentUserId, otherUserId)

    let conversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id,
          user2Id
        }
      }
    })

    // 如果没有会话，创建新的
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id,
          user2Id
        }
      })
    }

    res.json({
      success: true,
      data: {
        id: conversation.id,
        user1Id: conversation.user1Id,
        user2Id: conversation.user2Id
      }
    })

  } catch (error) {
    console.error('创建会话错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 获取会话详情（包含所有消息）
// ============================================================
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id)
    const userId = req.user.id
    const { page = 1, limit = 50 } = req.query

    // 检查会话是否存在且用户有权限
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: { select: { id: true, username: true, avatar: true } },
        user2: { select: { id: true, username: true, avatar: true } }
      }
    })

    if (!conversation) {
      return res.status(404).json({ message: '会话不存在' })
    }

    // 确认当前用户是会话参与者
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({ message: '无权访问此会话' })
    }

    // 获取消息列表（按时间正序，但分页从最新开始）
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },  // 倒序获取最新消息
        skip,
        take
      }),
      prisma.message.count({ where: { conversationId } })
    ])

    // 标记所有来自对方的消息为已读
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: { isRead: true }
    })

    // 格式化消息（反转回正序）
    const formattedMessages = messages.reverse().map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      isRead: msg.isRead,
      createdAt: msg.createdAt
    }))

    // 获取对方用户信息
    const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1

    res.json({
      success: true,
      data: {
        conversationId,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          avatar: otherUser.avatar
        },
        messages: formattedMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('获取消息列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 发送消息
// ============================================================
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id)
    const senderId = req.user.id
    const { content } = req.body

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '消息内容不能为空' })
    }

    // 检查会话是否存在
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    })

    if (!conversation) {
      return res.status(404).json({ message: '会话不存在' })
    }

    // 确认当前用户是会话参与者
    if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
      return res.status(403).json({ message: '无权在此会话中发送消息' })
    }

    // 创建消息
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content.trim()
      }
    })

    // 更新会话的更新时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    // 发送通知给对方（可选）
    const { createNotification } = require('./notifications')
    const otherUserId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id
    
    await createNotification({
      userId: otherUserId,
      type: 'message',
      content: `${req.user.username} 给你发了一条私信`,
      link: `/conversations/${conversationId}`,
      senderId: senderId,
      targetId: conversationId
    })

    res.status(201).json({
      success: true,
      data: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt
      }
    })

  } catch (error) {
    console.error('发送消息错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 获取未读消息总数
// ============================================================
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    // 找到所有涉及该用户的会话
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      select: { id: true }
    })

    const conversationIds = conversations.map(c => c.id)

    // 统计未读消息数量
    const unreadCount = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        isRead: false
      }
    })

    res.json({
      success: true,
      data: { unreadCount }
    })

  } catch (error) {
    console.error('获取未读消息数错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

module.exports = router
