const express = require('express')
const router = express.Router()
const data = require('../data')
const tokenLib = require('../lib/token')
const crypto = require('crypto')

// 模拟登录
router.post('/login', (req, res) => {
  const { username, password, identifier } = req.body
  
  // 支持 frontend 发送的 identifier
  const loginId = identifier || username

  if (!loginId || !password) {
    return res.json({ code: 1001, msg: 'Please provide username/phone and password' })
  }

  // 计算密码哈希
  const hash = crypto.createHash('sha256').update(String(password)).digest('hex')

  // 在 data.staff 中查找匹配的用户
  const staffRecord = data.staff.find(s => {
    // 匹配标识符 (用户名, 手机号, 或 工号)
    const matchId = (s.username === loginId || s.phone === loginId || s.staff_id === loginId)
    // 匹配密码
    const matchPass = s.passwordHash === hash
    return matchId && matchPass
  })

  // 如果找到用户，生成 Token 并返回
  if (staffRecord) {
    const sessionToken = tokenLib.generateTokenForUser(staffRecord)

    // 构建返回的 staff 信息 (去除敏感字段)
    const { passwordHash, token, ...safeStaff } = staffRecord
    
    // 确保有一些前端需要的字段 (如果 data.js 中缺少)
    const completeStaff = {
      ...safeStaff,
      lastLoginAt: new Date().toISOString()
    }

    res.json({
      code: 0,
      data: {
        token: sessionToken,
        staff: completeStaff
      },
      msg: 'success'
    })
  } else {
    // 登录失败
    res.json({ code: 1001, msg: 'Invalid credentials' })
  }
})

// Logout
router.post('/logout', (req, res) => {
    // 支持从 Authorization header 或 body.token 中读取
    const authHeader = req.headers['authorization'] || req.headers['Authorization']
    let token = null
    if (authHeader) {
      const parts = (Array.isArray(authHeader) ? authHeader[0] : authHeader).split(' ')
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) token = parts[1]
    }
    if (!token && req.body && req.body.token) token = req.body.token

    if (token) {
      tokenLib.revokeToken(token)
    }

    res.json({ code: 0, msg: 'success' })
})

// Register 新用户（示例）
router.post('/register', (req, res) => {
  const { phone, username, name, password } = req.body
  // 简单校验：phone 必须存在且为数字（Integer）
  if (phone === undefined || phone === null) return res.status(400).json({ code: 400, msg: 'Phone is required' })
  const phoneNum = Number(phone)
  if (!Number.isFinite(phoneNum) || !/^[0-9]+$/.test(String(phone))) {
    return res.status(400).json({ code: 400, msg: 'Phone must be numeric' })
  }

  const newUser = {
    user_id: 'u' + Date.now(),
    phone: phoneNum,
    nickname: username || name || String(phoneNum),
    status: 1,
    create_time: new Date()
  }

  data.users.push(newUser)

  // 返回成功信息（不自动登录），前端可根据需要跳转到登录页或实现自动登录
  res.json({ code: 0, data: { user: newUser }, msg: 'registered' })
})

module.exports = router
