const express = require('express')
const router = express.Router()
const data = require('../data')

// 获取交易记录 (订单, 充值, 消费, 积分变动等)
router.get('/', (req, res) => {
  const { userId, cardId, type, keyword, startDate, endDate, page = 1, pageSize = 10 } = req.query
  let list = data.transactions
  if (userId) list = list.filter(t => t.userId == userId)
  if (cardId) list = list.filter(t => t.cardId == cardId)
  if (type) list = list.filter(t => t.type === type)
  
  // 关键字筛选（用户名/备注/卡号/操作人）
  if (keyword) {
    const k = keyword.toLowerCase()
    list = list.filter(t => {
      const txUid = t.userId || t.user_id
      const u = data.users.find(u => (u.user_id || u.id || u.userId) == txUid)
      const userName = u ? (u.nickname || u.name || u.phone || '') : (t.userName || '')
      return userName.toLowerCase().includes(k) ||
        (t.note || '').toLowerCase().includes(k) ||
        (t.cardNo || t.card_no || '').toLowerCase().includes(k) ||
        (t.operatorName || t.operator || '').toLowerCase().includes(k)
    })
  }
  
  // 日期范围筛选
  if (startDate && endDate) {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime() + 24 * 3600 * 1000 - 1
    list = list.filter(t => {
      const tm = new Date(t.time || t.create_time).getTime()
      return tm >= start && tm <= end
    })
  }
  
  // 按照时间倒序
  const sorted = [...list].sort((a, b) => new Date(b.time || b.create_time).getTime() - new Date(a.time || a.create_time).getTime())

  // 为每条交易补充 userName（从 data.users 中查找）以便前端直接显示昵称
  const enhanced = sorted.map(tx => {
    // 兼容多种 userId 字段名 (userId, user_id)
    const txUid = tx.userId || tx.user_id
    // 兼容 data.users 中不同的 ID 字段名 (user_id, id, userId)
    const u = data.users.find(u => (u.user_id || u.id || u.userId) == txUid)
    return { 
      ...tx, 
      // 补充字段给前端渲染
      nickname: u ? (u.nickname || u.name || u.phone) : null,
      userName: u ? (u.nickname || u.name || u.phone) : (tx.userName || null)
    }
  })

  // 分页处理
  const total = enhanced.length
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const size = Math.max(1, parseInt(pageSize, 10) || 10)
  const startIdx = (pageNum - 1) * size
  const pagedList = enhanced.slice(startIdx, startIdx + size)

  res.json({ code: 0, data: { list: pagedList, total, page: pageNum, pageSize: size }, msg: 'success' })
})

// 创建一条交易记录 (通常由后端内部逻辑调用，但也暴露 API 以供前端手动录入兼容旧逻辑)
router.post('/', (req, res) => {
  const payload = req.body
  // allow operator info from query or body
  const operatorId = req.query.operatorId || req.query.orderid || payload.operatorId || payload.orderid || payload.order_id || null
  const operatorName = req.query.operatorName || payload.operatorName || null

  const newTx = {
    id: Date.now(),
    ...payload,
    time: payload.time || new Date().toISOString()
  }
  if (operatorId) newTx.operatorId = operatorId
  if (operatorName) newTx.operatorName = operatorName
  data.transactions.unshift(newTx)
  res.json({ code: 0, data: newTx, msg: 'success' })
})

module.exports = router
