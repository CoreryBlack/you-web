import axios from 'axios'
import { useAuthStore } from '../stores/auth'

// Axios API 客户端：默认指向本地开发服务器，可通过 VITE_API_BASE 覆盖
export const api = axios.create({
  baseURL: (import.meta.env && (import.meta.env.VITE_API_BASE as string)) || 'http://localhost:8080/api'
})

// 在请求中自动注入 Authorization: Bearer <token>
api.interceptors.request.use((cfg) => {
  try {
    const token = localStorage.getItem('token')
    if (token) {
      cfg.headers = cfg.headers || {}
      ;(cfg.headers as any)['Authorization'] = `Bearer ${token}`
    }
  } catch (e) {
    // ignore
  }
  return cfg
})

// 响应拦截器：检测401未授权或token过期，自动跳转登录页
api.interceptors.response.use(
  (response) => {
    // 检查业务层面的token过期（某些后端返回200但code表示未授权）
    const data = response.data
    if (data && (data.code === 401 || data.code === 1002 || data.code === 1003)) {
      // 1002/1003 通常表示token过期或无效
      handleUnauthorized()
      return Promise.reject(new Error(data.msg || '登录已过期，请重新登录'))
    }
    return response
  },
  (error) => {
    // HTTP 401 未授权
    if (error.response && error.response.status === 401) {
      handleUnauthorized()
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }
    return Promise.reject(error)
  }
)

// 处理未授权：清除token并跳转登录页
function handleUnauthorized() {
  // 清除本地存储
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  try {
    // 同步清理 Pinia 中的鉴权状态（避免仍被认为已登录）
    const auth = useAuthStore()
    if (auth && typeof auth.clearAuth === 'function') {
      auth.clearAuth()
    }
  } catch (e) {
    // ignore pinia state cleanup failures
  }
  
  // 跳转到登录页（避免重复跳转）
  if (window.location.pathname !== '/login') {
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
  }
}

// 以下导出基于后端 API 的封装，返回经过解析的数据结构
export async function fetchUsers(params?: any) {
  const res = await api.get('/users', { params })
  return res.data && res.data.data ? res.data.data : res.data
}

export async function fetchUser(id: string) {
  const res = await api.get(`/users/${id}`)
  return res.data && res.data.data ? res.data.data : res.data
}

export async function createUser(payload: any) {
  const res = await api.post('/users', payload)
  return res.data
}

export async function updateUser(id: string | number, payload: any) {
  const res = await api.put(`/users/${id}`, payload)
  return res.data
}

export async function deleteUser(id: string | number) {
  const res = await api.delete(`/users/${id}`)
  return res.data
}

export async function fetchStaff(params?: any) {
  const res = await api.get('/staff', { params })
  return res.data && res.data.data ? res.data.data : res.data
}

// 分页获取员工列表
export async function fetchStaffPaged(params?: { page?: number; pageSize?: number; keyword?: string; role?: number }) {
  const res = await api.get('/staff', { params })
  const body = res.data && res.data.data ? res.data.data : res.data
  const raw = Array.isArray(body) ? body : (body.records || body.list || body || [])
  const total = Array.isArray(body) ? raw.length : (body.total || raw.length || 0)
  const page = body.page || params?.page || 1
  const pageSize = body.pageSize || params?.pageSize || 10
  return { list: raw, total, page, pageSize }
}

export async function createStaff(payload: any) {
  const res = await api.post('/staff', payload)
  return res.data
}

export async function updateStaff(id: string, payload: any) {
  const res = await api.put(`/staff/${id}`, payload)
  return res.data
}

export async function deleteStaff(id: string) {
  const res = await api.delete(`/staff/${id}`)
  return res.data
}

export async function fetchStores(params?: any) {
  const res = await api.get('/stations', { params })
  return res.data && res.data.data ? res.data.data : res.data
}

export async function fetchCards(params?: any) {
  const res = await api.get('/cards', { params })
  return res.data && res.data.data ? res.data.data : res.data
}

// 分页获取储油卡列表
export async function fetchCardsPaged(params?: { page?: number; pageSize?: number; keyword?: string; type?: string }) {
  const res = await api.get('/cards', { params })
  const body = res.data && res.data.data ? res.data.data : res.data
  const raw = Array.isArray(body) ? body : (body.records || body.list || body || [])
  const total = Array.isArray(body) ? raw.length : (body.total || raw.length || 0)
  const page = body.page || params?.page || 1
  const pageSize = body.pageSize || params?.pageSize || 10
  return { list: raw, total, page, pageSize }
}

export async function createCard(payload: any) {
  const res = await api.post('/cards', payload)
  return res.data
}

export async function updateCard(cardNo: string, payload: any) {
  const res = await api.put(`/cards/${cardNo}`, payload)
  return res.data
}

export async function fetchOrders(params?: any) {
  const res = await api.get('/orders', { params })
  return res.data && res.data.data ? res.data.data : res.data
}

export async function createOrder(payload: any) {
  const res = await api.post('/orders', payload)
  return res.data
}

export async function fetchProducts(params?: any) {
  const res = await api.get('/products', { params })
  const body = res.data && res.data.data ? res.data.data : res.data
  return body.list || body
}

export async function createProduct(payload: any) {
  const res = await api.post('/products', payload)
  return res.data
}

export async function deleteProduct(id: string | number) {
  const res = await api.delete(`/products/${id}`)
  return res.data
}

// 分页获取交易记录（用于交易记录页面）
export async function fetchTransactionsPaged(params?: { page?: number; pageSize?: number; keyword?: string; type?: string; startDate?: string; endDate?: string }) {
  const res = await api.get('/transactions', { params })
  const body = res.data && res.data.data ? res.data.data : res.data
  // 兼容多种返回格式: { records: [...] } 或 { list: [...] } 或 直接数组 [...]
  const raw = Array.isArray(body) ? body : (body.records || body.list || body || [])
  const total = Array.isArray(body) ? raw.length : (body.total || raw.length || 0)
  const page = body.page || params?.page || 1
  const pageSize = body.pageSize || params?.pageSize || 10
  
  // Normalize backend transaction shape to front-end expected fields
  const mapped = (Array.isArray(raw) ? raw : [raw]).map((t: any) => {
    return {
      id: t.txnId ?? t.id ?? t.txn_id,
      user: t.nickname ?? t.userName ?? t.username ?? t.user ?? '',
      type: t.typeDesc || t.type || (typeof t.type === 'number' ? String(t.type) : ''),
      amount: typeof t.points !== 'undefined' && t.points !== null ? t.points : (typeof t.amountCents !== 'undefined' && t.amountCents !== null ? (Number(t.amountCents) / 100).toString() : ''),
      time: t.createTime || t.time || t.updateTime || t.create_time || '',
      note: t.remark ?? t.note ?? '',
      _raw: t,
      cardNo: t.cardNo ?? t.card_no ?? null,
      operator: t.operatorName ?? t.operator ?? t.staffName ?? t.operator_name ?? t.staff_name ?? t.operatorId ?? t.operator_id ?? t.orderId ?? t.order_id ?? t.orderid ?? null,
      status: t.status ?? null,
      statusDesc: t.statusDesc ?? t.status_desc ?? null
    }
  })

  // 尝试从 staff 列表中查找 operator 姓名并填充
  try {
    const staffBody = await fetchStaff()
    const staffList = (staffBody && (staffBody.list || staffBody)) || []
    if (Array.isArray(staffList) && staffList.length) {
      const byId = new Map()
      staffList.forEach((s: any) => {
        const id = s.staff_id ?? s.staffId ?? s.id ?? s.username
        const name = s.real_name ?? s.realName ?? s.name ?? s.nickname ?? s.username
        if (id) byId.set(String(id), name)
      })
      mapped.forEach(m => {
        const key = String(m.operator)
        if (byId.has(key)) m.operator = byId.get(key)
      })
    }
  } catch (e) {
    // ignore staff fetch failures
  }

  // 根据 userId 查询用户名并填充
  const needUserIds = Array.from(new Set(
    mapped.filter(m => (!m.user || String(m.user).trim() === '') && m._raw && (m._raw.userId || m._raw.user_id))
      .map(m => String(m._raw.userId ?? m._raw.user_id))
  ))
  if (needUserIds.length) {
    try {
      const usersBody = await fetchUsers()
      const usersList = (usersBody && (usersBody.list || usersBody.records || usersBody)) || []
      if (Array.isArray(usersList) && usersList.length) {
        const byId = new Map()
        usersList.forEach((u: any) => {
          const id = u.user_id ?? u.userId ?? u.id
          const name = u.nickname ?? u.name ?? u.phone ?? u.username
          if (id) byId.set(String(id), name)
        })
        mapped.forEach(m => {
          if ((!m.user || String(m.user).trim() === '') && m._raw) {
            const uid = String(m._raw.userId ?? m._raw.user_id ?? '')
            if (byId.has(uid)) m.user = byId.get(uid)
          }
        })
      }
    } catch (e) {
      // ignore user fetch failures
    }
  }

  return { list: mapped, total, page, pageSize }
}

export async function fetchTransactions(params?: any) {
  const res = await api.get('/transactions', { params })
  const body = res.data && res.data.data ? res.data.data : res.data
  const raw = body.list || body || []
  // Normalize backend transaction shape to front-end expected fields:
  // front-end expects: { id, user, type, amount, time, note, ... }
  const mapped = (Array.isArray(raw) ? raw : [raw]).map((t: any) => {
    return {
      // id used in table
      id: t.txnId ?? t.id ?? t.txn_id,
      // user display: prefer nickname then username then user (NOT fallback to ID here, let lookup handle it)
      user: t.nickname ?? t.userName ?? t.username ?? t.user ?? '',
      // type: human-readable if available, fallback to raw type
      type: t.typeDesc || t.type || (typeof t.type === 'number' ? String(t.type) : ''),
      // amount: prefer points (for point transactions) or cents converted to unit
      amount: typeof t.points !== 'undefined' && t.points !== null ? t.points : (typeof t.amountCents !== 'undefined' && t.amountCents !== null ? (Number(t.amountCents) / 100).toString() : ''),
      // time: createTime / time / updateTime
      time: t.createTime || t.time || t.updateTime || t.create_time || '',
      // note/remark
      note: t.remark ?? t.note ?? '',
      // keep original payload for detail view
      _raw: t,
      // other useful fields
      cardNo: t.cardNo ?? t.card_no ?? null,
      // operator / staff who performed the action: prefer name then various id fields
      operator: t.operatorName ?? t.operator ?? t.staffName ?? t.operator_name ?? t.staff_name ?? t.operatorId ?? t.operator_id ?? t.orderId ?? t.order_id ?? t.orderid ?? null,
      status: t.status ?? null,
      statusDesc: t.statusDesc ?? t.status_desc ?? null
    }
  })

  // 如果没有显示用户名但有 userId，则批量请求用户详情以填充 nickname
  const needUserIds = Array.from(new Set(mapped.filter(m => (!m.user || String(m.user).trim() === '') && m._raw && (m._raw.userId || m._raw.user_id)).map(m => (m._raw.userId ?? m._raw.user_id))))
  if (needUserIds.length) {
    await Promise.all(needUserIds.map(async uid => {
      try {
        const u = await fetchUser(uid)
        const display = (u && (u.nickname || u.nick || u.name || u.phone)) || null
        mapped.forEach(m => {
          const rawUid = m._raw && (m._raw.userId ?? m._raw.user_id)
          if (String(rawUid) === String(uid) && (!m.user || String(m.user).trim() === '')) m.user = display || String(uid)
        })
      } catch (e) {
        // ignore individual failures
      }
    }))
  }

  // 如果 operator 为 id（非姓名），尝试从 staff 列表中查找姓名并填充
  try {
    const staffBody = await fetchStaff()
    const staffList = (staffBody && (staffBody.list || staffBody)) || []
    if (Array.isArray(staffList) && staffList.length) {
      const toLookup = mapped.filter(m => m.operator && typeof m.operator === 'string' && m.operator.length > 0)
      const byId = new Map()
      staffList.forEach((s: any) => {
        const id = s.staff_id ?? s.staffId ?? s.id ?? s.username
        const name = s.real_name ?? s.realName ?? s.name ?? s.nickname ?? s.username
        if (id) byId.set(String(id), name)
      })
      toLookup.forEach(m => {
        const key = String(m.operator)
        if (byId.has(key)) m.operator = byId.get(key)
      })
    }
  } catch (e) {
    // ignore staff fetch failures
  }

  return mapped
}

function getOperatorFromStorage() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const u = JSON.parse(raw)
    // common id fields: staffId, staff_id, id, userId, user_id
    const id = u.staffId ?? u.staff_id ?? u.id ?? u.userId ?? u.user_id ?? null
    const name = u.name ?? u.realName ?? u.real_name ?? u.nickname ?? u.username ?? null
    return { id, name }
  } catch (e) {
    return null
  }
}

export async function createTransaction(payload: any) {
  // inject operator info when available
  const op = getOperatorFromStorage()
  if (op && op.id) {
    payload = { ...payload, orderid: op.id, order_id: op.id, orderId: op.id, operatorName: op.name ?? undefined }
  }
  const res = await api.post('/transactions', payload)
  return res.data
}

// 调整卡余额，amount_cents 为整数（分）
export async function adjustCardBalance(card_no: string, amount_cents: number) {
  // Send multiple key variants to be tolerant of backend naming (snake_case / camelCase)
  const payload: any = {
    // include multiple variants so different backends accept it
    card_no,
    cardNo: card_no,
    amount_cents: amount_cents,
    // compatibility keys
    amountCents: amount_cents,
    balance_cents: amount_cents,
    balanceCents: amount_cents,
    // some backends expect a FuelCard-like object in body
    card: { cardNo: card_no, balanceCents: amount_cents }
  }
  // include operator id if present
  const op = getOperatorFromStorage()
  if (op && op.id) {
    payload.orderid = op.id
    payload.order_id = op.id
    payload.orderId = op.id
    if (op.name) payload.operatorName = op.name
  }
  const res = await api.post('/cards/adjust-balance', payload)
  return res.data
}

// 调整用户积分：delta 为整数（可为负数）
export async function adjustUserPoints(userId: string | number, delta: number, note?: string) {
  // 构造与后端实体 PointsAccount 对齐的请求体：{ userId, points, updateTime }
  const payload: any = {
    userId: userId,
    userid: userId,
    user_id: userId,
    points: delta,
    // 兼容旧命名
    delta,
    points_delta: delta,
    note: note || ''
  }
  // include operator info when available
  const op = getOperatorFromStorage()
  // 后端期望 operatorId 作为 request param（query），不是 body
  const params: any = {}
  if (op && op.id) params.operatorId = op.id
  const res = await api.post('/points/adjust-points', payload, { params: Object.keys(params).length ? params : undefined })
  return res.data
}

// 查询用户积分，返回 PointsAccount 风格的数据
export async function fetchUserPoints(userId: string | number) {
  // 使用统一的 query 风格：/api/points?userId=xxx
  const res = await api.get('/points', { params: { userId } })
  const body = res.data && res.data.data ? res.data.data : res.data
  return body
}

// 管理员设置：获取全局设置（如油价、积分倍率）
export async function fetchAdminSettings() {
  try {
    const res = await api.get('/admin/settings')
    const body = res.data && res.data.data ? res.data.data : res.data
    return body
  } catch (e) {
    // 兼容部分后端没有该接口的情况，返回 null
    return null
  }
}

// 保存管理员设置
export async function saveAdminSettings(payload: any) {
  const res = await api.post('/admin/settings', payload)
  return res.data
}

// Staff auth helpers
export async function staffLogin(type: 'username' | 'phone' | 'staffId', identifier: string, password?: string, passwordHash?: string) {
  const payload: any = { identifier }
  if (passwordHash) payload.passwordHash = passwordHash
  else if (password) payload.password = password
  const res = await api.post('/staff/login', payload, { params: { type } })
  return res.data
}

export async function staffRegister(payload: any) {
  const res = await api.post('/staff/register', payload)
  return res.data
}
