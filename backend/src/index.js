// backend/src/index.js
// require('dotenv').config()
const app = require('./app')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 后端服务器已启动: http://localhost:${PORT}`)
  console.log(`📁 数据库: SQLite (./dev.db)`)
})
