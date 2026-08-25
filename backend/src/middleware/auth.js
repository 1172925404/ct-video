// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key'

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: '未授权，请先登录' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(401).json({ message: '用户不存在' })
    }

    req.user = user
    next()

  } catch (error) {
    return res.status(403).json({ message: 'Token 无效或已过期' })
  }
}

module.exports = { authenticate }