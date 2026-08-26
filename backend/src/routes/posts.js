// backend/src/routes/posts.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')
const multer = require('multer')  // 👈 新增
const path = require('path')      // 👈 新增
const fs = require('fs')          // 👈 新增
const jwt = require('jsonwebtoken')  // 👈 新增

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// 配置 multer（图片上传）
// ============================================================
// 确保 com_pic 目录存在
const comPicDir = path.join(__dirname, '../../uploads/com_pic')
if (!fs.existsSync(comPicDir)) {
  fs.mkdirSync(comPicDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, comPicDir)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 JPG、PNG、GIF、WEBP 格式'), false)
    }
  }
})

// ============================================================
// 获取帖子列表（包含当前用户是否已点赞）
// ============================================================
router.get('/', async (req, res) => {
  try {
    // 👇 获取当前用户ID（如果有）
    let currentUserId = null
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
        currentUserId = decoded.id
      } catch (e) {
        // Token 无效，忽略
      }
    }

    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        postComments: {
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
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 👇 如果用户已登录，查询每个帖子的点赞状态
    let likedPostIds = []
    if (currentUserId) {
      const likes = await prisma.postLike.findMany({
        where: {
          userId: currentUserId,
          postId: { in: posts.map(p => p.id) }
        },
        select: { postId: true }
      })
      likedPostIds = likes.map(l => l.postId)
    }

    // 👇 修复：过滤掉 author 为 null 的帖子，并安全处理
    const formattedPosts = posts
      .filter(p => p.author !== null && p.author !== undefined)  // 过滤掉没有作者的帖子
      .map(p => ({
        id: p.id,
        userId: p.author.id,  // 👈 此时 p.author 一定有值
        title: p.title,
        content: p.content,
        author: p.author.username,
        avatar: p.author.avatar,
        images: p.images ? JSON.parse(p.images) : [],
        likes: p.likes,
        liked: likedPostIds.includes(p.id),
        createdAt: p.createdAt,
        comments: p.postComments
          .filter(c => c.author !== null && c.author !== undefined)  // 👈 过滤评论中作者为 null 的
          .map(c => ({
            id: c.id,
            userId: c.author.id,
            author: c.author.username,
            avatar: c.author.avatar,
            content: c.content,
            createdAt: c.createdAt
          }))
      }))

    res.json({
      success: true,
      data: formattedPosts
    })

  } catch (error) {
    console.error('获取帖子列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 获取帖子详情（包含当前用户是否已点赞）
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)

    // 👇 获取当前用户ID（如果有）
    let currentUserId = null
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
        currentUserId = decoded.id
      } catch (e) {
        // Token 无效，忽略
      }
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        postComments: {
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
        }
      }
    })

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }

    // 👇 修复：检查 post.author 是否存在
    if (!post.author) {
      return res.status(404).json({ message: '帖子作者不存在，数据异常' })
    }

    // 👇 查询当前用户是否已点赞
    let liked = false
    if (currentUserId) {
      const like = await prisma.postLike.findUnique({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId: id
          }
        }
      })
      liked = !!like
    }

    const formattedPost = {
      id: post.id,
      userId: post.author.id,
      title: post.title,
      content: post.content,
      author: post.author.username,
      avatar: post.author.avatar,
      images: post.images ? JSON.parse(post.images) : [],
      likes: post.likes,
      liked: liked,
      createdAt: post.createdAt,
      comments: post.postComments
        .filter(c => c.author !== null && c.author !== undefined)  // 👈 过滤评论中作者为 null 的
        .map(c => ({
          id: c.id,
          userId: c.author.id,
          author: c.author.username,
          avatar: c.author.avatar,
          content: c.content,
          createdAt: c.createdAt
        }))
    }

    res.json({
      success: true,
      data: formattedPost
    })

  } catch (error) {
    console.error('获取帖子详情错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 👇 新增：获取用户发布的帖子列表
// ============================================================
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        postComments: {
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
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 👇 修复：过滤掉 author 为 null 的帖子
    const formattedPosts = posts
      .filter(p => p.author !== null && p.author !== undefined)
      .map(p => ({
        id: p.id,
        userId: p.author.id,
        title: p.title,
        content: p.content,
        author: p.author.username,
        avatar: p.author.avatar,
        images: p.images ? JSON.parse(p.images) : [],
        likes: p.likes,
        liked: false,
        createdAt: p.createdAt,
        comments: p.postComments
          .filter(c => c.author !== null && c.author !== undefined)
          .map(c => ({
            id: c.id,
            userId: c.author.id,
            author: c.author.username,
            avatar: c.author.avatar,
            content: c.content,
            createdAt: c.createdAt
          }))
      }))

    res.json({
      success: true,
      data: formattedPosts
    })

  } catch (error) {
    console.error('获取用户帖子列表错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 发布帖子（支持图片上传）
// ============================================================
router.post('/', authenticate, upload.array('images', 6), async (req, res) => {
  try {
    const { title, content } = req.body
    const userId = req.user.id

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: '标题不能为空' })
    }
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '内容不能为空' })
    }

    // 处理上传的图片
    const imageUrls = []
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imageUrls.push(`/uploads/com_pic/${file.filename}`)
      })
    }

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId: userId,
        images: JSON.stringify(imageUrls)
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

    const formattedPost = {
      id: post.id,
      userId: post.author.id,
      title: post.title,
      content: post.content,
      author: post.author.username,
      avatar: post.author.avatar,
      images: JSON.parse(post.images),
      likes: post.likes,
      liked: false,
      createdAt: post.createdAt,
      comments: []
    }

    res.status(201).json({
      success: true,
      message: '发布成功',
      data: formattedPost
    })

  } catch (error) {
    console.error('发布帖子错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 删除帖子
// ============================================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id

    const post = await prisma.post.findUnique({
      where: { id }
    })

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ message: '无权删除此帖子' })
    }

    // 删除帖子关联的图片文件
    if (post.images) {
      try {
        const images = JSON.parse(post.images)
        images.forEach(imageUrl => {
          const filename = path.basename(imageUrl)
          const filePath = path.join(comPicDir, filename)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        })
      } catch (e) {
        console.error('删除图片文件错误:', e)
      }
    }

    // 同时删除帖子下的所有评论
    await prisma.postComment.deleteMany({
      where: { postId: id }
    })

    // 删除帖子点赞记录
    await prisma.postLike.deleteMany({
      where: { postId: id }
    })

    await prisma.post.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: '删除成功'
    })

  } catch (error) {
    console.error('删除帖子错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ============================================================
// 点赞/取消点赞帖子（使用 PostLike 表）
// ============================================================
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id

    const post = await prisma.post.findUnique({
      where: { id }
    })

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }

    // 检查是否已点赞
    const existing = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id
        }
      }
    })

    // 👇 导入通知函数
    const { createNotification } = require('./notifications')

    if (existing) {
      // 取消点赞
      await prisma.postLike.delete({
        where: {
          userId_postId: {
            userId,
            postId: id
          }
        }
      })
      await prisma.post.update({
        where: { id },
        data: { likes: { decrement: 1 } }
      })
      res.json({ success: true, message: '已取消点赞', liked: false })
    } else {
      // 添加点赞
      await prisma.postLike.create({
        data: {
          userId,
          postId: id
        }
      })
      await prisma.post.update({
        where: { id },
        data: { likes: { increment: 1 } }
      })

      // 👇 发送通知（不通知自己）
      if (userId !== post.authorId) {
        await createNotification({
          userId: post.authorId,
          type: 'like',
          content: `${req.user.username} 点赞了你的帖子`,
          link: `/post/${id}`,
          senderId: userId,
          targetId: id
        })
      }

      res.json({ success: true, message: '点赞成功', liked: true })
    }

  } catch (error) {
    console.error('点赞帖子错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

module.exports = router
