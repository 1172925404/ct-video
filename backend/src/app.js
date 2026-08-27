// backend/src/app.js
const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()

// 👇 修改：显式配置 CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ✅ 静态文件服务
const uploadsPath = path.resolve(__dirname, '../uploads')
console.log('📁 上传目录路径:', uploadsPath)
app.use('/uploads', express.static(uploadsPath))

// 👇 新增：com_pic 静态文件服务（帖子图片）
const comPicPath = path.resolve(__dirname, '../uploads/com_pic')
console.log('📁 帖子图片目录:', comPicPath)
app.use('/uploads/com_pic', express.static(comPicPath))

// 路由
const authRoutes = require('./routes/auth')
const videoRoutes = require('./routes/videos')
const favoriteRoutes = require('./routes/favorites')
const historyRoutes = require('./routes/history')
const commentRoutes = require('./routes/comments')
const postRoutes = require('./routes/posts')
const postCommentRoutes = require('./routes/postComments')
const followRoutes = require('./routes/follows')  // 👈 新增：关注路由
const uploadRoutes = require('./routes/upload')   // 👈 新增：上传路由
const { router: notificationRoutes } = require('./routes/notifications')  // 👈 新增：通知路由
const userRoutes = require('./routes/users')  // 👈 新增：用户路由
const conversationRoutes = require('./routes/conversations')  // 👈 新增：私信路由

app.use('/api/auth', authRoutes)
app.use('/api/videos', videoRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/history', historyRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/post-comments', postCommentRoutes)
app.use('/api/follows', followRoutes)  // 👈 新增
app.use('/api/upload', uploadRoutes)   // 👈 新增：上传路由
app.use('/api/notifications', notificationRoutes)  // 👈 新增：通知路由
app.use('/api/users', userRoutes)  // 👈 新增：用户路由
app.use('/api/conversations', conversationRoutes)  // 👈 新增：私信路由

// 👇 新增：处理 OPTIONS 预检请求
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.sendStatus(200)
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' })
})

module.exports = app
