// backend/src/routes/postComments.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// 获取帖子的所有评论
// ============================================================
router.get('/post/:postId', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId)

    const comments = await prisma.postComment.findMany({
      where: { postId },
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

    const formattedComments = comments.map(c => ({
      id: c.id,
      userId: c.author.id,  // 👈 新增：用户ID
      author: c.author.username,
      avatar: c.author.avatar,
      content: c.content,
      createdAt: c.createdAt
    }))

    res.json({
      success: true,
      data: formattedComments
    })

  } catch (error) {
    console.error('获取帖子评论错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 发表帖子评论
// ============================================================
router.post('/', authenticate, async (req, res) => {
  try {
    const { postId, content } = req.body
    const userId = req.user.id

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '评论内容不能为空' })
    }

    // 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    })

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }

    const comment = await prisma.postComment.create({
      data: {
        content: content.trim(),
        authorId: userId,
        postId: parseInt(postId)
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

    const formattedComment = {
      id: comment.id,
      userId: comment.author.id,  // 👈 新增：用户ID
      author: comment.author.username,
      avatar: comment.author.avatar,
      content: comment.content,
      createdAt: comment.createdAt
    }

    res.status(201).json({
      success: true,
      message: '评论发表成功',
      data: formattedComment
    })

  } catch (error) {
    console.error('发表帖子评论错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 删除帖子评论
// ============================================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id

    const comment = await prisma.postComment.findUnique({
      where: { id }
    })

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' })
    }

    if (comment.authorId !== userId) {
      return res.status(403).json({ message: '无权删除此评论' })
    }

    await prisma.postComment.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: '删除成功'
    })

  } catch (error) {
    console.error('删除帖子评论错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

module.exports = router