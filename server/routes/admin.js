const express = require('express')
const router = express.Router()
const data = require('../data')

// 仅管理员可访问的设置接口
function ensureAdmin(req, res, next) {
  // req.user 由 index.js 中间件注入
  if (!req.user) return res.status(401).json({ code: 401, msg: 'Unauthorized' })
  const role = req.user.role
  if (role === 'admin' || role === 1) return next()
  return res.status(403).json({ code: 403, msg: 'Forbidden: admin only' })
}

// 获取设置（包含定价）
router.get('/settings', ensureAdmin, (req, res) => {
  const pricing = data.pricing || { gasoline: {}, diesel: {} }
  const payload = {
    gasoline: pricing.gasoline || {},
    diesel: pricing.diesel || {},
    // 新语义：每 1 元 = X 积分
    pointsPerYuan: typeof data.pointsPerYuan !== 'undefined' ? data.pointsPerYuan : null
  }
  res.json({ code: 0, data: payload, msg: 'success' })
})

// 更新设置（仅允许管理员）
router.post('/settings', ensureAdmin, (req, res) => {
  const body = req.body || {}

  // 合并汽油价格
  if (!data.pricing) data.pricing = { gasoline: {}, diesel: {} }
  const pg = data.pricing.gasoline || {}
  const pd = data.pricing.diesel || {}

  // 支持多种字段命名：92/95/98, gasPrice/gas_price 等
  const setGas = (key, val) => {
    if (typeof val !== 'undefined' && val !== null && val !== '') {
      const n = Number(val)
      if (!Number.isNaN(n)) pg[String(key)] = n
    }
  }
  const setDiesel = (key, val) => {
    if (typeof val !== 'undefined' && val !== null && val !== '') {
      const n = Number(val)
      if (!Number.isNaN(n)) pd[String(key)] = n
    }
  }

  // Common explicit keys
  setGas('92', body['92'] ?? body['92#'] ?? body.gas92 ?? body.gas_92 ?? body['92_price'] ?? body['92price'])
  setGas('95', body['95'] ?? body['95#'] ?? body.gas95 ?? body.gas_95 ?? body['95_price'] ?? body['95price'])
  setGas('98', body['98'] ?? body['98#'] ?? body.gas98 ?? body.gas_98 ?? body['98_price'] ?? body['98price'])

  // Also accept generic gasPrice variants mapping to default 92 if provided as single value
  if (typeof body.oilPrice !== 'undefined') {
    // if single oilPrice provided, set as default for 92 if 92 missing
    const v = Number(body.oilPrice)
    if (!Number.isNaN(v)) {
      if (!pg['92']) pg['92'] = v
    }
  }

  // Diesel keys
  setDiesel('0', body['0'] ?? body['0#'] ?? body.diesel0 ?? body.diesel_0 ?? body['0_price'])
  setDiesel('-10', body['-10'] ?? body['-10#'] ?? body.dieselm10 ?? body.diesel_m10 ?? body['-10_price'])

  // Also accept grouped objects
  if (body.gasoline && typeof body.gasoline === 'object') {
    Object.keys(body.gasoline).forEach(k => setGas(k, body.gasoline[k]))
  }
  if (body.diesel && typeof body.diesel === 'object') {
    Object.keys(body.diesel).forEach(k => setDiesel(k, body.diesel[k]))
  }

  // pointsPerYuan 支持（兼容旧字段 pointsRate / points_rate）
  if (typeof body.pointsPerYuan !== 'undefined') {
    const pr = Number(body.pointsPerYuan)
    if (!Number.isNaN(pr)) data.pointsPerYuan = pr
  } else if (typeof body.points_per_yuan !== 'undefined') {
    const pr = Number(body.points_per_yuan)
    if (!Number.isNaN(pr)) data.pointsPerYuan = pr
  } else if (typeof body.pointsRate !== 'undefined') {
    const pr = Number(body.pointsRate)
    if (!Number.isNaN(pr)) data.pointsPerYuan = pr
  } else if (typeof body.points_rate !== 'undefined') {
    const pr = Number(body.points_rate)
    if (!Number.isNaN(pr)) data.pointsPerYuan = pr
  }

  // persist back to in-memory store
  data.pricing.gasoline = pg
  data.pricing.diesel = pd

  res.json({ code: 0, data: data.pricing, msg: 'success' })
})

module.exports = router
