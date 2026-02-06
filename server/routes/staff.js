const express = require('express')
const router = express.Router()
const data = require('../data')
const crypto = require('crypto')

// 获取员工列表
router.get('/', (req, res) => {
  const { keyword, name, role, page = 1, pageSize = 10 } = req.query
  
  // 返回时确保不以明文字段 `password` 暴露，兼容旧字段名并映射到 `passwordHash`
  let list = data.staff.map(s => {
    const copy = { ...s }
    if (copy.password) {
      copy.passwordHash = copy.password
      delete copy.password
    }
    return copy
  })
  
  // 关键字/姓名筛选
  const searchKey = keyword || name
  if (searchKey) {
    const k = searchKey.toLowerCase()
    list = list.filter(s => 
      (s.name || '').toLowerCase().includes(k) ||
      (s.username || '').toLowerCase().includes(k) ||
      (s.phone || '').toLowerCase().includes(k)
    )
  }
  
  // 角色筛选
  if (role) {
    list = list.filter(s => s.role == role)
  }
  
  // 分页处理
  const total = list.length
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const size = Math.max(1, parseInt(pageSize, 10) || 10)
  const startIdx = (pageNum - 1) * size
  const pagedList = list.slice(startIdx, startIdx + size)

  res.json({
    code: 0,
    data: {
      total,
      list: pagedList,
      page: pageNum,
      pageSize: size
    },
    msg: 'success'
  })
})

// 创建员工
router.post('/', (req, res) => {
  const { username, phone, name, role, station_id, password, passwordHash } = req.body
  const newStaff = {
    staff_id: 's' + Date.now(),
    username,
    phone,
    name,
    role,
    station_id,
    status: 1,
    create_time: new Date()
  }

  // 获取明文密码进行哈希处理（哈希交给后端）
  const plainPassword = passwordHash || password
  if (plainPassword) {
    const hash = crypto.createHash('sha256').update(String(plainPassword)).digest('hex')
    newStaff.passwordHash = hash
  }

  data.staff.push(newStaff)
  // 返回时不要包含明文 password 字段，前端使用 passwordHash 字段
  res.json({ code: 0, data: newStaff, msg: 'success' })
})

// 更新员工
router.put('/:id', (req, res) => {
  const { id } = req.params
  const idx = data.staff.findIndex(s => s.staff_id === id)
  if (idx > -1) {
    const update = { ...req.body }
    // 支持前端以 password 或 passwordHash 传入明文，由后端统一哈希处理
    const plainPassword = update.passwordHash || update.password
    if (plainPassword && plainPassword.length < 64) { // 简单判断是否已经是SHA256哈希（长度64）
      const hash = crypto.createHash('sha256').update(String(plainPassword)).digest('hex')
      update.passwordHash = hash
      if (update.password) delete update.password
    }

    data.staff[idx] = { ...data.staff[idx], ...update }
    res.json({ code: 0, data: data.staff[idx], msg: 'success' })
  } else {
    res.json({ code: 404, msg: 'Staff not found' })
  }
})

// 删除员工
router.delete('/:id', (req, res) => {
    const { id } = req.params
    data.staff = data.staff.filter(s => s.staff_id !== id)
    res.json({ code: 0, msg: 'success' })
})

module.exports = router
