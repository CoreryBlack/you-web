const express = require('express')
const router = express.Router()

const data = require('../data')
let users = data.users

// 获取会员列表
router.get('/', (req, res) => {
  const { phone, page, size } = req.query
  let result = users
  if (phone) {
    result = users.filter(u => u.phone.includes(phone))
  }
  const total = result.length
  const p = parseInt(page, 10) || 1
  const s = parseInt(size, 10) || 10
  const start = (p - 1) * s
  const list = result.slice(start, start + s)
  res.json({
    code: 0,
    data: {
      total,
      list
    },
    msg: 'success'
  })
})

// 获取详情
router.get('/:id', (req, res) => {
  const user = users.find(u => u.user_id === req.params.id)
  if (user) {
    res.json({ code: 0, data: user, msg: 'success' })
  } else {
    res.json({ code: 404, msg: 'User not found' })
  }
})

// 注册
router.post('/', (req, res) => {
  const { phone, nickname } = req.body
  const newUser = {
    user_id: 'u' + Date.now(),
    phone,
    nickname,
    status: 1,
    create_time: new Date()
  }
  users.push(newUser)
  res.json({ code: 0, data: newUser, msg: 'success' })
})

// 更新用户（修改）
router.put('/:id', (req, res) => {
  const id = req.params.id
  const idx = users.findIndex(u => u.user_id === id)
  if (idx === -1) return res.status(404).json({ code: 404, msg: 'User not found' })
  const body = req.body || {}
  // 允许更新的字段：phone, nickname, status
  const allowed = ['phone', 'nickname', 'status']
  allowed.forEach(k => {
    if (typeof body[k] !== 'undefined') users[idx][k] = body[k]
  })
  users[idx].update_time = new Date()
  res.json({ code: 0, data: users[idx], msg: 'success' })
})

// 删除用户
router.delete('/:id', (req, res) => {
  const id = req.params.id
  const idx = users.findIndex(u => u.user_id === id)
  if (idx === -1) return res.status(404).json({ code: 404, msg: 'User not found' })
  const removed = users.splice(idx, 1)[0]
  res.json({ code: 0, data: removed, msg: 'success' })
})

// 调整用户积分
router.post('/:id/adjust-points', (req, res) => {
  const id = req.params.id
  const { delta } = req.body
  if (typeof delta === 'undefined') return res.status(400).json({ code: 400, msg: 'Missing delta' })
  const d = Number(delta)
  if (Number.isNaN(d) || !Number.isInteger(d)) return res.status(400).json({ code: 400, msg: 'Invalid delta, must be integer' })
  const idx = users.findIndex(u => u.user_id === id)
  if (idx === -1) return res.status(404).json({ code: 404, msg: 'User not found' })
  const current = Number(users[idx].points) || 0
  const newPoints = current + d
  if (newPoints < 0) return res.status(400).json({ code: 400, msg: 'Insufficient points' })
  users[idx].points = newPoints
  users[idx].update_time = new Date()
  res.json({ code: 0, data: { user_id: users[idx].user_id, points: users[idx].points }, msg: 'success' })
})

module.exports = router
