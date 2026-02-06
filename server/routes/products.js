const express = require('express')
const router = express.Router()
const data = require('../data')

// 获取商品列表
router.get('/', (req, res) => {
  res.json({ code: 0, data: { list: data.products, total: data.products.length }, msg: 'success' })
})

// 创建/修改商品
router.post('/', (req, res) => {
  const { id, name, points, stock, description } = req.body
  if (id) {
    const idx = data.products.findIndex(p => p.id === id)
    if (idx >= 0) {
      data.products[idx] = { ...data.products[idx], name, points, stock, description }
      return res.json({ code: 0, data: data.products[idx], msg: 'success' })
    }
  }
  const newProduct = {
    id: (data.products.reduce((s, r) => Math.max(s, r.id), 0) || 0) + 1,
    name,
    points,
    stock,
    description
  }
  data.products.unshift(newProduct)
  res.json({ code: 0, data: newProduct, msg: 'success' })
})

// 删除商品
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const idx = data.products.findIndex(p => p.id === id)
  if (idx === -1) return res.status(404).json({ code: 404, msg: 'Product not found' })
  const removed = data.products.splice(idx, 1)[0]
  res.json({ code: 0, data: removed, msg: 'success' })
})

module.exports = router
