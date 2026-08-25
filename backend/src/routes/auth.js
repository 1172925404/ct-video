// backend/src/routes/auth.js
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key'

// ===== 注册 =====
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body

    // 验证
    if (!username || username.length < 3) {
      return res.status(400).json({ message: '用户名至少3个字符' })
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: '密码至少6个字符' })
    }
    if (email && !email.includes('@')) {
      return res.status(400).json({ message: '请输入有效的邮箱地址' })
    }

    // 检查用户名是否已存在
    const existing = await prisma.user.findUnique({
      where: { username }
    })
    if (existing) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null,
        avatar: `https://picsum.photos/seed/${username}/200`,
        bio: ''
      }
    })

    // 生成 Token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 返回用户信息（不含密码）
    const { password: _, ...userInfo } = user
    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: userInfo
    })

  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ===== 登录 =====
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' })
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    // 生成 Token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    const { password: _, ...userInfo } = user
    res.json({
      success: true,
      message: '登录成功',
      token,
      user: userInfo
    })

  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
})

// ===== 验证 Token =====
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: '未提供 Token' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(401).json({ message: '用户不存在' })
    }

    const { password: _, ...userInfo } = user
    res.json({ success: true, user: userInfo })

  } catch (error) {
    res.status(401).json({ message: 'Token 无效或已过期' })
  }
})

module.exports = router