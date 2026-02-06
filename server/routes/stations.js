const express = require('express')
const router = express.Router()
const data = require('../data')

// 获取油站列表
router.get('/', (req, res) => {
  res.json({ code: 0, data: { list: data.stations }, msg: 'success' })
})

// 创建油站
router.post('/', (req, res) => {
  const { name, address } = req.body
  const newStation = {
    station_id: 'st' + Date.now(),
    name,
    address,
    status: 1,
    create_time: new Date()
  }
  data.stations.push(newStation)
  res.json({ code: 0, data: newStation, msg: 'success' })
})

// 获取终端
router.get('/:id/terminals', (req, res) => {
    // 模拟终端数据
    const terminals = [
        { terminal_id: 't001', station_id: req.params.id, model: 'POS-X1', status: 1 }
    ]
    res.json({ code: 0, data: { list: terminals }, msg: 'success' })
})

module.exports = router
