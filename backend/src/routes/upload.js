// backend/src/routes/upload.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const router = express.Router()
const prisma = new PrismaClient()

// ============================================================
// 配置 multer（视频上传）
// ============================================================
// 确保 videos 目录存在
const videoDir = path.join(__dirname, '../../uploads/videos')
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true })
}

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoDir)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
  }
})

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB 限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('请上传 MP4、WebM、MOV 或 AVI 格式的视频'), false)
    }
  }
})

// ============================================================
// 上传视频
// ============================================================
router.post('/video', authenticate, videoUpload.single('video'), async (req, res) => {
  try {
    const { title, description, tags, category } = req.body
    const userId = req.user.id

    // 验证必填字段
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: '请输入视频标题' })
    }
    if (!req.file) {
      return res.status(400).json({ message: '请选择视频文件' })
    }

    // 解析标签（JSON 字符串）
    let tagArray = []
    if (tags) {
      try {
        tagArray = JSON.parse(tags)
      } catch (e) {
        tagArray = []
      }
    }

    // 获取视频时长（简单实现，实际可用 ffprobe）
    const duration = '00:00'

    // 保存到数据库
    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description || '',
        url: `/uploads/videos/${req.file.filename}`,
        cover: null,
        authorId: userId,
        views: 0,
        likes: 0,
        duration: duration,
        tags: JSON.stringify(tagArray)
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

    const formattedVideo = {
      id: video.id,
      title: video.title,
      description: video.description,
      cover: video.cover,
      url: video.url,
      views: video.views,
      likes: video.likes,
      duration: video.duration || '00:00',
      pubDate: video.createdAt,
      author: video.author.username,
      authorAvatar: video.author.avatar,
      tags: video.tags ? JSON.parse(video.tags) : [],
      _liked: false,
      _favorited: false
    }

    res.status(201).json({
      success: true,
      message: '视频上传成功！',
      data: formattedVideo
    })

  } catch (error) {
    console.error('视频上传错误:', error)
    res.status(500).json({ message: '服务器内部错误，请重试' })
  }
})

// ============================================================
// 上传封面图
// ============================================================
const thumbDir = path.join(__dirname, '../../uploads/thumbnails')
if (!fs.existsSync(thumbDir)) {
  fs.mkdirSync(thumbDir, { recursive: true })
}

const thumbStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, thumbDir)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
  }
})

const thumbUpload = multer({
  storage: thumbStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('请上传 JPG、PNG 或 WEBP 格式的图片'), false)
    }
  }
})

router.post('/thumbnail', authenticate, thumbUpload.single('thumbnail'), async (req, res) => {
  try {
    const { videoId } = req.body

    if (!req.file) {
      return res.status(400).json({ message: '请选择封面图' })
    }
    if (!videoId) {
      return res.status(400).json({ message: '请指定视频ID' })
    }

    const coverUrl = `/uploads/thumbnails/${req.file.filename}`

    // 更新视频封面
    const video = await prisma.video.update({
      where: { id: parseInt(videoId) },
      data: { cover: coverUrl }
    })

    res.json({
      success: true,
      message: '封面图上传成功！',
      data: { cover: coverUrl }
    })

  } catch (error) {
    console.error('封面图上传错误:', error)
    res.status(500).json({ message: '服务器内部错误，请重试' })
  }
})

module.exports = router