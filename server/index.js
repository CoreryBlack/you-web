const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const PORT = process.env.PORT || 8080

const tokenLib = require('./lib/token')

// Allow CORS for development; explicitly allow Authorization header for preflight
app.use(cors({ origin: true, allowedHeaders: ['Content-Type', 'Authorization'] }))
app.use(bodyParser.json())

// 显式处理 CORS 预检，确保返回 Access-Control-Allow-* 头。
app.use((req, res, next) => {
  // For development allow all origins so preflight always receives ACAO header
  res.header('Access-Control-Allow-Origin', '*')
  // If you prefer restricting to the frontend origin, replace '*' with the origin value
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  // 如果需要让浏览器携带 Cookie，可设置：
  // res.header('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// 简单的 API 鉴权中间件：对 /api 下除了 /api/auth 的路由要求 Authorization 头
app.use('/api', (req, res, next) => {
  // 允许不需要鉴权的登录/注册路由（位于 /api/staff/login 和 /api/staff/register）
  if (req.path && (req.path.startsWith('/staff/login') || req.path.startsWith('/staff/register'))) return next()

  const authHeader = req.headers['authorization'] || req.headers['Authorization']
  if (!authHeader) {
    return res.status(401).json({ code: 401, msg: 'Unauthorized' })
  }

  const parts = (Array.isArray(authHeader) ? authHeader[0] : authHeader).split(' ')
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    // 将 token 暂存在 req 上，路由可读取 req.token
    const token = parts[1]
    // Verify token and attach user
    const verified = tokenLib.verifyToken(token)
    if (!verified) {
      console.warn('Token verification failed for token:', token.substring(0, 10) + '...')
      return res.status(401).json({ code: 401, msg: 'Invalid or expired token' })
    }
    req.token = token
    req.user = verified.user
    req.userType = verified.type
    return next()
  }

  return res.status(401).json({ code: 401, msg: 'Invalid auth header format' })
})

// 引入路由
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const staffRoutes = require('./routes/staff')
const stationRoutes = require('./routes/stations')
const cardRoutes = require('./routes/cards')
const orderRoutes = require('./routes/orders')
const pointsRoutes = require('./routes/points')
const productRoutes = require('./routes/products')
const transactionRoutes = require('./routes/transactions')
const adminRoutes = require('./routes/admin')

// 注册路由
app.use('/api/staff', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/stations', stationRoutes)
app.use('/api/cards', cardRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/points', pointsRoutes)
app.use('/api/products', productRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/admin', adminRoutes)

// 健康检查
app.get('/', (req, res) => {
  res.send('You-Web API Server is running')
})

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})
