const express = require('express')
const router = express.Router()
const data = require('../data')

// 获取订单
router.get('/', (req, res) => {
  res.json({ code: 0, data: { list: data.orders, total: data.orders.length }, msg: 'success' })
})

// 创建订单 (POS上传)
router.post('/', (req, res) => {
  const { client_tx_id, amount_cents, station_id } = req.body
  const newOrder = {
    order_id: 'ord' + Date.now(),
    client_tx_id,
    amount_cents,
    station_id,
    status: 1, // 成功
    pay_time: new Date(),
    create_time: new Date()
  }
  data.orders.unshift(newOrder)
  res.json({ code: 0, data: newOrder, msg: 'success' })
})

module.exports = router
