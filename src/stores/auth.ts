import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<any>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null)

  function setToken(t: string | null) {
    token.value = t
    if (t) {
      localStorage.setItem('token', t)
    } else {
      localStorage.removeItem('token')
    }
  }

  function setUser(u: any) {
    user.value = u
    if (u) {
      localStorage.setItem('user', JSON.stringify(u))
    } else {
      localStorage.removeItem('user')
    }
  }

  // 将后端返回的 staff 对象规范化为前端使用的 camelCase 字段
  function normalizeStaff(s: any) {
    if (!s) return null
    return {
      // 工号/ID
      staffId: s.staffId || s.staff_id || s.id || '',
      username: s.username || s.userName || s.login || '',
      // 姓名兼容 realName / real_name / nickname
      name: s.name || s.realName || s.real_name || s.nickname || '',
      phone: s.phone || s.mobile || s.phoneNumber || '',
      role: s.role,
      status: s.status,
      stationId: s.stationId || s.station_id || null,
      failedLoginCount: s.failedLoginCount ?? 0,
      createTime: s.createTime || s.create_time || s.createdAt || null,
      updateTime: s.updateTime || s.update_time || s.updatedAt || null,
      // 保留原始完整对象以备需要
      _raw: s
    }
  }

  // 处理后端返回的认证数据 payload (通常是 response.data.data)
  function resolveAuthData(data: any) {
    if (!data) return

    // 1. 尝试提取 Token
    let t: string | null = null
    if (data.token) t = data.token
    // 如果 data 本身包含 token (兼容)
    if (!t && typeof data === 'string') t = data

    if (t) setToken(t)

    // 2. 尝试提取 Staff
    let staffRaw: any = null
    if (data.staff || data.user) {
      staffRaw = data.staff || data.user
    } else if (data.staffId || data.username) {
      // data 本身看起来像 user 对象
      staffRaw = data
    }

    const staff = normalizeStaff(staffRaw)
    if (staff) setUser(staff)
  }

  async function login(identifier: string, password: string, type?: string) {
    // 调用后端登录接口：后端期望 body 包含 `identifier`，并通过 query param `type` 指定类型
    try {
      // 兼容修正：同时发送 identifier 和 username，防止后端只识别 username 字段
      const payload: any = { identifier, username: identifier }
      // 优先传 passwordHash（若前端已预哈希），否则传明文 password（后端会把其赋给 passwordHash 字段并直接比较）
      if (password && password.length > 0) payload.password = password
      const res = await api.post('/staff/login', payload, { params: { type } })
      const body = res.data
      if (body && body.code === 0) {
        // 后端示例：{ code:0, data: { token: '...', staff: { staffId:..., ... } }, msg:'success' }
        if (body.data) {
          resolveAuthData(body.data)
        } else if (body.token) {
           // 兼容顶层 token
           resolveAuthData(body)
        } else {
           return Promise.reject(new Error('服务端未返回有效数据'))
        }
        
        if (!token.value) return Promise.reject(new Error('服务端未返回有效令牌'))
        return Promise.resolve()
      }
      return Promise.reject(new Error((body && body.msg) || '登录失败'))
    } catch (err: any) {
      return Promise.reject(new Error(err?.response?.data?.msg || err.message || '登录请求失败'))
    }
  }

  // Logout: call backend to revoke server-side token, then clear local state
  async function logout() {
    try {
      // API interceptor will attach Authorization header
      await api.post('/staff/logout')
    } catch (e) {
      // ignore errors but continue to clear local state
    }
    clearAuth()
  }

  function clearAuth() {
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = () => {
    const t = token.value
    if (!t) return false
    if (typeof t === 'string') {
      const s = t.trim().toLowerCase()
      if (s === 'null' || s === 'undefined' || s === '') return false
    }
    return true
  }

  const isAdmin = () => {
    // 新版角色映射：1=收银员(cashier), 2=站长(station manager), 3=管理员(admin)
    return user.value && Number(user.value.role) === 3
  }

  const isCashier = () => {
    return user.value && Number(user.value.role) === 1
  }

  const isStationManager = () => {
    return user.value && Number(user.value.role) === 2
  }

  const hasRole = (r: number | string) => {
    if (!user.value) return false
    return String(user.value.role) === String(r)
  }

  return { token, user, setToken, setUser, login, logout, isAuthenticated, resolveAuthData, isAdmin, isCashier, isStationManager, hasRole, clearAuth }
})
