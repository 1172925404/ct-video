// backend/src/routes/comments.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// 获取某个视频的所有评论
// ============================================================
router.get('/video/:videoId', async (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId)

    const comments = await prisma.comment.findMany({
      where: { 
        videoId,
        parentId: null  // 只获取顶级评论，回复暂不处理
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 转换数据格式
    const formattedComments = comments.map(c => ({
      id: c.id,
      userId: c.author.id,  // 👈 新增：用户ID
      username: c.author.username,
      avatar: c.author.avatar,
      content: c.content,
      createdAt: c.createdAt,
      likes: c.likes,
      liked: false,  // 前端控制
      replies: []
    }))

    res.json({
      success: true,
      data: formattedComments
    })

  } catch (error) {
    console.error('获取评论列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 发表评论
// ============================================================
router.post('/', authenticate, async (req, res) => {
  try {
    const { videoId, content, parentId } = req.body
    const userId = req.user.id

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '评论内容不能为空' })
    }

    // 检查视频是否存在
    const video = await prisma.video.findUnique({
      where: { id: parseInt(videoId) }
    })
    if (!video) {
      return res.status(404).json({ message: '视频不存在' })
    }

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: userId,
        videoId: parseInt(videoId),
        parentId: parentId ? parseInt(parentId) : null
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

    // 转换数据格式
    const formattedComment = {
      id: comment.id,
      userId: comment.author.id,  // 👈 新增：用户ID
      username: comment.author.username,
      avatar: comment.author.avatar,
      content: comment.content,
      createdAt: comment.createdAt,
      likes: comment.likes,
      liked: false,
      replies: []
    }

    res.status(201).json({
      success: true,
      message: '评论发表成功',
      data: formattedComment
    })

  } catch (error) {
    console.error('发表评论错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 删除评论
// ============================================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id)
    const userId = req.user.id

    // 检查评论是否存在
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' })
    }

    // 检查是否是自己的评论
    if (comment.authorId !== userId) {
      return res.status(403).json({ message: '无权删除此评论' })
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    res.json({
      success: true,
      message: '评论已删除'
    })

  } catch (error) {
    console.error('删除评论错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 点赞/取消点赞评论（使用 CommentLike 表）
// ============================================================
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id)
    const userId = req.user.id

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' })
    }

    // 检查是否已点赞
    const existing = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    })

    if (existing) {
      // 取消点赞
      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId,
            commentId
          }
        }
      })
      await prisma.comment.update({
        where: { id: commentId },
        data: { likes: { decrement: 1 } }
      })
      res.json({ success: true, message: '已取消点赞', liked: false })
    } else {
      // 添加点赞
      await prisma.commentLike.create({
        data: {
          userId,
          commentId
        }
      })
      await prisma.comment.update({
        where: { id: commentId },
        data: { likes: { increment: 1 } }
      })
      res.json({ success: true, message: '点赞成功', liked: true })
    }

  } catch (error) {
    console.error('点赞评论错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

module.exports = router