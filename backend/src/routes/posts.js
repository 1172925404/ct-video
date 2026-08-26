// backend/src/routes/posts.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const cloudinary = require('cloudinary').v2  // 👈 新增

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// Cloudinary 配置
// ============================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// ============================================================
// 配置 multer（图片上传到 Cloudinary，使用内存存储）
// ============================================================
const storage = multer.memoryStorage()  // 👈 改用内存存储

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
// 获取帖子列表
// ============================================================
router.get('/', async (req, res) => {
  try {
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
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedPosts = posts.map(p => ({
      id: p.id,
      userId: p.author.id,  // 👈 新增：用户ID
      title: p.title,
      content: p.content,
      author: p.author.username,
      avatar: p.author.avatar,
      images: p.images ? JSON.parse(p.images) : [],
      likes: p.likes,
      liked: false,
      createdAt: p.createdAt,
      comments: p.postComments.map(c => ({
        id: c.id,
        userId: c.author.id,  // 👈 新增：评论用户ID
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
// 获取帖子详情
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)

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

    const formattedPost = {
      id: post.id,
      userId: post.author.id,  // 👈 新增：用户ID
      title: post.title,
      content: post.content,
      author: post.author.username,
      avatar: post.author.avatar,
      images: post.images ? JSON.parse(post.images) : [],
      likes: post.likes,
      liked: false,
      createdAt: post.createdAt,
      comments: post.postComments.map(c => ({
        id: c.id,
        userId: c.author.id,  // 👈 新增：评论用户ID
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
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedPosts = posts.map(p => ({
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
      comments: p.postComments.map(c => ({
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
// 发布帖子（支持图片上传到 Cloudinary）
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

    // 👇 上传图片到 Cloudinary
    const imageUrls = []
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: 'image',
                folder: 'ct-video/post-images',
                public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`,
                use_filename: true,
                unique_filename: true
              },
              (error, result) => {
                if (error) reject(error)
                else resolve(result)
              }
            )
            uploadStream.end(file.buffer)
          })
          imageUrls.push(result.secure_url)  // 👈 Cloudinary 永久链接
        } catch (uploadError) {
          console.error('单张图片上传失败:', uploadError)
          // 继续上传其他图片
        }
      }
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
      userId: post.author.id,  // 👈 新增：用户ID
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

    // 删除帖子关联的图片文件（Cloudinary 上的）
    // 注意：Cloudinary 文件无法通过 API 直接删除，这里只记录日志
    // 如需删除，需要使用 cloudinary.uploader.destroy
    if (post.images) {
      try {
        const images = JSON.parse(post.images)
        // 可选：从 Cloudinary 删除图片
        // for (const imageUrl of images) {
        //   const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0]
        //   await cloudinary.uploader.destroy(`ct-video/post-images/${publicId}`)
        // }
        console.log(`帖子 ${id} 的图片已从数据库移除，Cloudinary 文件保留`)
      } catch (e) {
        console.error('删除图片记录错误:', e)
      }
    }

    // 同时删除帖子下的所有评论
    await prisma.postComment.deleteMany({
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
      res.json({ success: true, message: '点赞成功', liked: true })
    }

  } catch (error) {
    console.error('点赞帖子错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

module.exports = router
