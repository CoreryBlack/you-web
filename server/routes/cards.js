const express = require('express')
const router = express.Router()
const data = require('../data')

// 查询卡
router.get('/', (req, res) => {
  const { card_no, user_id, keyword, type, page = 1, pageSize = 10 } = req.query
  let list = data.cards
  if (card_no) list = list.filter(c => c.card_no === card_no || c.cardNo === card_no)
  if (user_id) list = list.filter(c => c.user_id === user_id || c.userId === user_id)
  if (type) list = list.filter(c => c.type === type || c.cardType === type || c.card_type === type)
  
  // 关键字筛选（手机号/卡号）
  if (keyword) {
    const k = keyword.toLowerCase()
    list = list.filter(c => {
      // 尝试从用户列表获取手机号
      const uid = c.user_id || c.userId
      const u = uid ? data.users.find(u => (u.user_id || u.id || u.userId) == uid) : null
      const phone = u ? (u.phone || '') : ''
      const cardNo = c.card_no || c.cardNo || ''
      return cardNo.toLowerCase().includes(k) || phone.toLowerCase().includes(k)
    })
  }
  
  // 分页处理
  const total = list.length
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const size = Math.max(1, parseInt(pageSize, 10) || 10)
  const startIdx = (pageNum - 1) * size
  const pagedList = list.slice(startIdx, startIdx + size)
  
  res.json({ code: 0, data: { list: pagedList, total, page: pageNum, pageSize: size }, msg: 'success' })
})

// 开卡
router.post('/', (req, res) => {
  const { user_id, initial_balance } = req.body
  const newCard = {
    card_no: '8' + Math.floor(Math.random() * 1000000),
    user_id,
    balance_cents: initial_balance || 0,
    status: 1,
    create_time: new Date()
  }
  data.cards.push(newCard)
  res.json({ code: 0, data: newCard, msg: 'success' })
})

// 交易记录
router.get('/:card_no/transactions', (req, res) => {
    const { card_no } = req.params
    const list = data.transactions.filter(t => t.cardNo === card_no || t.card_no === card_no)
    res.json({ 
        code: 0, 
        data: { 
            list 
        }, 
        msg: 'success' 
    })
})

// 调整卡余额
router.post('/adjust-balance', (req, res) => {
  const { card_no, amount_cents, note } = req.body
  if (!card_no || typeof amount_cents === 'undefined') {
    return res.status(400).json({ code: 400, msg: 'Missing card_no or amount_cents' })
  }
  const idx = data.cards.findIndex(c => c.card_no === card_no)
  if (idx === -1) return res.status(404).json({ code: 404, msg: 'Card not found' })
  const delta = Number(amount_cents)
  if (Number.isNaN(delta)) return res.status(400).json({ code: 400, msg: 'Invalid amount_cents' })
  const current = Number(data.cards[idx].balance_cents) || 0
  const newBalance = current + delta
  if (newBalance < 0) return res.status(400).json({ code: 400, msg: 'Insufficient balance' })
  
  data.cards[idx].balance_cents = newBalance

  // 记录交易
  data.transactions.unshift({
    id: Date.now(),
    cardNo: card_no,
    userId: data.cards[idx].user_id,
    type: delta > 0 ? 'card_recharge' : 'card_spend',
    amount: Math.abs(delta) / 100, // 注意后端通常存分，这里兼容前端可能期望的元，或者统一存分
    amount_cents: delta,
    note: note || '',
    time: new Date().toISOString()
  })

  // 返回更新后的卡信息
  res.json({ code: 0, data: { card_no: data.cards[idx].card_no, balance_cents: data.cards[idx].balance_cents }, msg: 'success' })
})

// 更新卡 (例如解绑用户)
router.put('/:card_no', (req, res) => {
  const { card_no } = req.params
  const idx = data.cards.findIndex(c => c.card_no === card_no)
  if (idx === -1) return res.status(404).json({ code: 404, msg: 'Card not found' })
  
  const body = req.body || {}
  if (typeof body.user_id !== 'undefined') data.cards[idx].user_id = body.user_id
  if (typeof body.status !== 'undefined') data.cards[idx].status = body.status
  
  res.json({ code: 0, data: data.cards[idx], msg: 'success' })
})

module.exports = router
