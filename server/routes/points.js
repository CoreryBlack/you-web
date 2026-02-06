const express = require('express')
const router = express.Router()

const data = require('../data')
let users = data.users

// POST /adjust-points
// Accepts a PointsAccount-like body: { userId|userid|user_id: string, points: number, updateTime?: string }
// For backward compatibility also accepts { delta, points_delta }
router.post('/adjust-points', (req, res) => {
  const body = req.body || {}
  const userId = body.userId || body.userid || body.user_id

  // 支持多种命名：优先使用 body.points（该值被视为要变动的 delta），其次是 delta / points_delta
  let delta = NaN
  if (typeof body.points !== 'undefined') delta = Number(body.points)
  else if (typeof body.delta !== 'undefined') delta = Number(body.delta)
  else if (typeof body.points_delta !== 'undefined') delta = Number(body.points_delta)

  if (!userId) return res.status(400).json({ code: 400, msg: 'Missing userid' })
  if (Number.isNaN(delta) || !Number.isInteger(delta)) return res.status(400).json({ code: 400, msg: 'Invalid points value, must be integer' })

  const idx = users.findIndex(u => (u.user_id || u.id || u.ID || u.userId) == userId)
  if (idx === -1) return res.status(404).json({ code: 404, msg: 'User not found' })

  const current = Number(users[idx].points) || 0
  const newPoints = current + delta
  if (newPoints < 0) return res.status(400).json({ code: 400, msg: 'Insufficient points' })

  users[idx].points = newPoints
  users[idx].update_time = new Date()

  // 记录交易
  // 支持接收 operatorId/operator_id/operatorId/orderid 等多种来源（query 或 body）
  const operatorId = req.query.operatorId || req.query.orderid || body.operatorId || body.orderid || body.order_id || null
  const operatorName = req.query.operatorName || body.operatorName || null

  const tx = {
    id: Date.now(),
    userId: userId,
    type: delta > 0 ? 'points_earn' : 'points_spend',
    amount: delta,
    note: body.note || '',
    time: new Date().toISOString()
  }
  if (operatorId) tx.operatorId = operatorId
  if (operatorName) tx.operatorName = operatorName
  data.transactions.unshift(tx)

  res.json({ code: 0, data: { user_id: users[idx].user_id, points: users[idx].points }, msg: 'success' })
})

  // GET /adjust-points/:userId  - 返回 PointsAccount 风格数据
  router.get('/adjust-points/:userId', (req, res) => {
    const userId = req.params.userId
    const idx = users.findIndex(u => (u.user_id || u.id || u.ID || u.userId) == userId)
    if (idx === -1) return res.status(404).json({ code: 404, msg: 'User not found' })
    const u = users[idx]
    return res.json({ code: 0, data: { userId: u.user_id || u.userId || u.id, points: Number(u.points) || 0, updateTime: u.update_time || u.update_time || u.updateTime || null }, msg: 'success' })
  })

  // GET /  - 支持通过 query ?userId=xxx 查询
  router.get('/', (req, res) => {
    const q = req.query || {}
    const userId = q.userId || q.userid || q.user_id
    if (!userId) {
      // 返回所有 PointsAccount-like 列表
      const list = users.map(u => ({ userId: u.user_id || u.userId || u.id, points: Number(u.points) || 0, updateTime: u.update_time || u.updateTime || null }))
      return res.json({ code: 0, data: list, msg: 'success' })
    }
    const idx = users.findIndex(u => (u.user_id || u.id || u.ID || u.userId) == userId)
    if (idx === -1) return res.status(404).json({ code: 404, msg: 'User not found' })
    const u = users[idx]
    return res.json({ code: 0, data: { userId: u.user_id || u.userId || u.id, points: Number(u.points) || 0, updateTime: u.update_time || u.updateTime || null }, msg: 'success' })
  })

module.exports = router
