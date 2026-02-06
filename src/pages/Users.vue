<template>
  <el-card>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="margin:0">用户管理</h3>
      <div style="display:flex;gap:8px">
        <el-button type="primary" @click="openCreate">新增用户</el-button>
      </div>
    </div>

    <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center">
      <el-input v-model="filters.keyword" placeholder="搜索手机号" clearable @keyup.enter="loadList(true)" style="width:260px" />
      <el-button type="primary" plain @click="loadList(true)">查询</el-button>
    </div>

    <el-table :data="pagedList" stripe style="width:100%" row-key="id">
      <el-table-column type="expand">
        <template #default="{ row }">
            <!-- 使用 grid 对齐到表格列：realName(120) username(110) phone(140) 卡数(80) 状态(90) 积分(70) -->
            <div style="display:grid;grid-template-columns:120px 1fr 1fr 160px;align-items:start;gap:12px">
              <!-- 第一列留空占位（姓名列） -->
              <div></div>

              <!-- 汽油卡区域：卡信息靠左，按钮靠右 -->
              <div style="min-width:180px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
                <div>
                  <strong>汽油卡</strong>
                  <div v-if="cardByType(row.id, 'gasoline')">
                    <div style="white-space:nowrap">卡号：{{ abbreviateCardNo(cardByType(row.id, 'gasoline')?.cardNo) }}</div>
                    <div style="white-space:nowrap">余额：{{ cardByType(row.id, 'gasoline').balance }}</div>
                  </div>
                  <div v-else style="color:#999">未绑定汽油卡</div>
                </div>
                <div style="display:flex;align-items:center">
                  <el-button size="mini" type="primary" plain @click="openCardTx(cardByType(row.id,'gasoline'))">调整余额</el-button>
                </div>
              </div>

              <!-- 柴油卡区域：卡信息靠左，按钮靠右 -->
              <div style="min-width:180px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
                <div>
                  <strong>柴油卡</strong>
                  <div v-if="cardByType(row.id, 'diesel')">
                    <div style="white-space:nowrap">卡号：{{ abbreviateCardNo(cardByType(row.id, 'diesel')?.cardNo) }}</div>
                    <div style="white-space:nowrap">余额：{{ cardByType(row.id, 'diesel').balance }}</div>
                  </div>
                  <div v-else style="color:#999">未绑定柴油卡</div>
                </div>
                <div style="display:flex;align-items:center">
                  <el-button size="mini" type="primary" plain @click="openCardTx(cardByType(row.id,'diesel'))">调整余额</el-button>
                </div>
              </div>

              <!-- 积分与操作 -->
              <div style="display:flex;justify-content:space-between;align-items:center;min-width:120px">
                <div>
                  <strong>积分</strong>
                  <div>{{ row.points }}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                  <el-button size="mini" type="primary" plain @click="openPoints(row)">调整积分</el-button>
                </div>
              </div>
            </div>
          </template>
      </el-table-column>

      <el-table-column prop="nickname" label="姓名" width="120" align="center" />
      
      <el-table-column prop="phone" label="手机号" width="140" align="center" show-overflow-tooltip />
      <el-table-column label="油卡数" width="80" align="center">
        <template #default="{ row }">{{ cardCount(row.id) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90" align="center">
        <template #default="{ row }">{{ row.status === 1 ? '正常' : '停用' }}</template>
      </el-table-column>
      <el-table-column prop="points" label="积分" width="70" align="center" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button
            size="small"
            :type="row.status === 1 ? 'danger' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
          <el-button size="small" plain @click="openEdit(row)">修改</el-button>
          <el-button type="danger" size="small" plain @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top:12px;display:flex;justify-content:flex-end;align-items:center">
      <el-pagination background :page-size="pageSize" :total="total" layout="prev, pager, next" v-model:current-page="page" @current-change="onPageChange" />
    </div>

    <el-dialog :title="isEdit ? '编辑用户' : '新增用户'" v-model="dialogVisible">
      <el-form :model="form" ref="userForm" label-position="top">
        
        <el-form-item label="姓名">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="正常" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="积分操作" v-model="pointsDialogVisible">
      <el-form :model="pointsForm" label-position="top">
        <el-form-item label="用户">
          <div>{{ pointsForm.target?.nickname || pointsForm.target?.phone }}</div>
        </el-form-item>
        <el-form-item label="操作">
          <el-select v-model="pointsForm.mode" placeholder="选择操作">
            <el-option label="积分增加" value="add" />
            <el-option label="积分消费" value="deduct" />
          </el-select>
        </el-form-item>
        <el-form-item label="积分值">
          <el-input-number v-model="pointsForm.delta" :step="1" :min="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="pointsForm.note" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pointsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="applyPoints">确认</el-button>
      </template>
    </el-dialog>
    
    <el-dialog title="新建储油卡" v-model="newCardDialogVisible">
      <el-form :model="newCardForm" label-position="top">
        <el-form-item label="卡号">
          <el-input v-model="newCardForm.cardNo" />
        </el-form-item>
        <el-form-item label="余额">
          <el-input-number v-model="newCardForm.balance" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newCardDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createCardAndBind">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="卡交易" v-model="cardTxDialogVisible">
      <el-form :model="cardTxForm" label-position="top">
        <el-form-item label="卡号">
          <div>{{ cardTxForm.card?.cardNo }} （{{ cardTypeLabel(cardTxForm.card?.type) }}）</div>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="cardTxForm.mode" placeholder="选择类型">
            <el-option label="充值" value="recharge" />
            <el-option label="支出" value="spend" />
            <el-option label="退款" value="refund" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input v-model="cardTxForm.amount" type="number" :disabled="(cardTxForm.mode === 'recharge' || cardTxForm.mode === 'spend') && cardTxForm.preset !== 'other'" />
          <div v-if="cardTxForm.mode === 'recharge' || cardTxForm.mode === 'spend'" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            <el-button size="mini" :type="cardTxForm.preset===50 ? 'primary' : 'default'" @click="(cardTxForm.amount = 50, cardTxForm.preset = 50)">50</el-button>
            <el-button size="mini" :type="cardTxForm.preset===100 ? 'primary' : 'default'" @click="(cardTxForm.amount = 100, cardTxForm.preset = 100)">100</el-button>
            <el-button size="mini" :type="cardTxForm.preset===200 ? 'primary' : 'default'" @click="(cardTxForm.amount = 200, cardTxForm.preset = 200)">200</el-button>
            <el-button size="mini" :type="cardTxForm.preset===500 ? 'primary' : 'default'" @click="(cardTxForm.amount = 500, cardTxForm.preset = 500)">500</el-button>
            <el-button size="mini" :type="cardTxForm.preset==='other' ? 'primary' : 'default'" @click="(cardTxForm.preset = 'other', cardTxForm.amount = 0)">其他</el-button>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="cardTxForm.note" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cardTxDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCardTx">提交</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed, onMounted } from 'vue'
import { fetchUsers, fetchCards, createUser, createCard, updateUser, deleteUser, adjustCardBalance, adjustUserPoints, fetchUserPoints, updateCard } from '../services/api'

type User = { id: number; username: string; nickname?: string; phone?: string; points: number; status: number }

export default defineComponent({
  name: 'Users',
  setup() {
    const all = ref<User[]>([])
    const cards = ref<any[]>([])
    const filters = reactive({ keyword: '' })
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const form = reactive<User>({ id: 0, username: '', nickname: '', phone: '', points: 0, status: 1 })

    const pointsDialogVisible = ref(false)
    const pointsForm = reactive({ target: null as User | null, delta: 0, note: '', mode: 'add' as 'add' | 'deduct' })

    const cardTxDialogVisible = ref(false)
    const cardTxForm = reactive({ card: null as any, mode: 'recharge', amount: 0, note: '', preset: 'other' })

    const page = ref(1)
    const pageSize = 10
    const total = ref(0)
    const bindCardId = ref<number | null>(null)
    const newCardDialogVisible = ref(false)
    const newCardForm = reactive({ cardNo: '', balance: 0 })

    const loadList = async (reset = false) => {
      if (reset) page.value = 1
      try {
        const params: any = { page: page.value, size: pageSize }
        if (filters.keyword) params.phone = filters.keyword
        const u = await fetchUsers(params)
        let list: any[] = []
        if (Array.isArray(u)) list = u
        else if (u && Array.isArray(u.records)) list = u.records
        else if (u && Array.isArray(u.list)) list = u.list
        else list = []

        all.value = (list || []).map((x: any, idx: number) => ({
          id: x.userId || x.user_id || x.id || x.ID || idx + 1,
          username: x.nickname || x.username || '',
          nickname: x.nickname || x.realName || '',
          phone: x.phone || '',
          points: x.points || 0,
          status: typeof x.status !== 'undefined' ? x.status : 1
        }))
        total.value = (u && (typeof u.total !== 'undefined' ? u.total : list.length)) || list.length
      } catch (e) {
        console.error('load users failed', e)
        all.value = []
        total.value = 0
      }
      await loadCards()

      try {
        const promises = all.value.map(u => fetchUserPoints(u.id).catch(() => null))
        const responses = await Promise.all(promises)
        responses.forEach((body, idx) => {
          if (!body) return
          let data: any = body && body.data ? body.data : body
          if (Array.isArray(data)) data = data[0]
          if (!data) return
          const pts = typeof data.points !== 'undefined' ? data.points : null
          if (pts !== null && typeof pts !== 'undefined') {
            all.value[idx].points = Number(pts) || 0
          }
        })
      } catch (e) {
        console.warn('fetchUserPoints failed', e)
      }
    }

    const loadCards = async () => {
      try {
        const c = await fetchCards()
        const list = (c && (c.list || c)) || []
        cards.value = (list || []).map((x: any, idx: number) => {
          const idVal = x.id || x.card_id || x.cardNo || idx + 1
          const cardNoVal = x.cardNo || x.card_no || x.card || ''
          const bc = typeof x.balance_cents !== 'undefined'
            ? Number(x.balance_cents)
            : (typeof x.balanceCents !== 'undefined'
              ? Number(x.balanceCents)
              : (typeof x.balance !== 'undefined' ? Math.round(Number(x.balance) * 100) : 0))
          return {
            id: idVal,
            cardNo: cardNoVal,
            balanceCents: bc,
            balance: bc / 100,
            userId: x.userId || x.user_id || null,
            type: typeof x.cardType !== 'undefined' ? (x.cardType === 1 ? 'gasoline' : x.cardType === 2 ? 'diesel' : String(x.cardType)) : (x.type || 'gasoline')
          }
        })
      } catch (e) {
        console.error('load cards failed', e)
        cards.value = []
      }
    }

    const filtered = computed(() => {
      if (!filters.keyword) return all.value
      const k = filters.keyword.toLowerCase()
      return all.value.filter(u => u.username.toLowerCase().includes(k) || (u.nickname || '').toLowerCase().includes(k) || (u.phone || '').includes(k))
    })

    function cardCount(userId: number | string) {
      return cards.value.filter(c => String(c.userId) === String(userId)).length
    }

    function cardByType(userId: number | string, type: string) {
      return cards.value.find(c => String(c.userId) === String(userId) && c.type === type) || null
    }

    function abbreviateCardNo(no?: string | null) {
      if (!no) return ''
      const s = String(no)
      if (s.length <= 10) return s
      return `${s.slice(0,4)}…${s.slice(-4)}`
    }

    function cardTypeLabel(t: any) {
      if (t === null || typeof t === 'undefined') return ''
      if (typeof t === 'number') return t === 1 ? '汽油' : t === 2 ? '柴油' : String(t)
      const s = String(t).toLowerCase()
      if (s.includes('gas') || s.includes('汽')) return '汽油'
      if (s.includes('dies') || s.includes('柴')) return '柴油'
      return String(t)
    }

    function openCardTx(card: any) {
      cardTxForm.card = card
      cardTxForm.mode = 'recharge'
      cardTxForm.amount = 0
      cardTxForm.note = ''
      cardTxForm.preset = 'other'
      cardTxDialogVisible.value = true
    }

    async function submitCardTx() {
      const c = cardTxForm.card
      if (!c) return
      const amt = Number(cardTxForm.amount || 0)
      if (amt <= 0) return alert('请输入大于0的金额')

      const deltaCents = cardTxForm.mode === 'spend' ? -Math.round(amt * 100) : Math.round(amt * 100)
      
      try {
        await adjustCardBalance(c.cardNo, deltaCents, cardTxForm.note)
        cardTxDialogVisible.value = false
        await loadCards()
      } catch (e: any) {
        console.error('adjust balance failed', e)
        alert(e.response?.data?.msg || '调整余额失败')
      }
    }

    const pagedList = computed(() => {
      return all.value
    })

    function onPageChange(p: number) {
      page.value = p
      loadList()
    }

    function openCreate() {
      isEdit.value = false
      Object.assign(form, { id: 0, username: '', nickname: '', phone: '', points: 0, status: 1 })
      dialogVisible.value = true
    }

    function openEdit(row: User) {
      isEdit.value = true
      Object.assign(form, { ...row })
      dialogVisible.value = true
    }

    async function save() {
      try {
        const payload = { nickname: form.nickname || '', phone: form.phone, status: form.status }
        if (isEdit.value) {
          await updateUser(form.id, payload)
        } else {
          const resp = await createUser(payload)
          const created = resp && (resp.data || resp) ? (resp.data || resp) : null
          const newId = created && (created.user_id || created.id) ? (created.user_id || created.id) : null
          if (newId) {
            // 为新用户默认开两张卡
            await createCard({ cardNo: `G-${newId}-${Date.now()}`, initial_balance: 0, user_id: newId, type: 'gasoline' })
            await createCard({ cardNo: `D-${newId}-${Date.now()+1}`, initial_balance: 0, user_id: newId, type: 'diesel' })
          }
        }
        dialogVisible.value = false
        await loadList(true)
      } catch (e: any) {
        alert('保存失败: ' + (e.response?.data?.msg || e.message))
      }
    }

    async function remove(row: User) {
      if (!confirm('确认删除用户？')) return
      try {
        await deleteUser(row.id)
        await loadList(true)
      } catch (e: any) {
        console.error('delete user failed', e)
        alert('删除用户失败')
      }
    }

    async function toggleStatus(row: User) {
      const targetStatus = row.status === 1 ? 2 : 1
      const msg = targetStatus === 2 ? '确认停用该用户？' : '确认启用该用户？'
      if (!confirm(msg)) return
      try {
        await updateUser(row.id, { status: targetStatus })
        await loadList()
      } catch (e: any) {
        console.error('update status failed', e)
        alert('更新用户状态失败')
      }
    }

    function openPoints(row: User, mode = 'add') {
      pointsForm.target = row
      pointsForm.delta = 0
      pointsForm.note = ''
      pointsForm.mode = mode as 'add' | 'deduct'
      pointsDialogVisible.value = true
    }

    async function unbindCard(c: any) {
      if (!confirm('确认解绑该储油卡？')) return
      try {
        await updateCard(c.cardNo, { user_id: null })
        await loadCards()
      } catch (e: any) {
        alert('解绑失败')
      }
    }

    function openCreateCard() {
      newCardForm.cardNo = ''
      newCardForm.balance = 0
      newCardDialogVisible.value = true
    }

    async function createCardAndBind() {
      if (!newCardForm.cardNo) return alert('请输入卡号')
      if (!form.id) return alert('请先保存用户')
      try {
        const cents = Math.round(Number(newCardForm.balance || 0) * 100)
        await createCard({ cardNo: newCardForm.cardNo, initial_balance: cents, user_id: form.id, type: 'gasoline' })
        newCardDialogVisible.value = false
        await loadCards()
      } catch (e: any) {
        alert('创建卡失败')
      }
    }

    async function applyPoints() {
      if (!pointsForm.target) return
      const d = Number(pointsForm.delta || 0)
      const applied = pointsForm.mode === 'deduct' ? -Math.abs(d) : Math.abs(d)
      try {
        await adjustUserPoints(pointsForm.target.id, applied, pointsForm.note)
        pointsDialogVisible.value = false
        await loadList()
      } catch (e: any) {
        console.error('adjust points failed', e)
        alert(e.response?.data?.msg || '调整积分失败')
      }
    }

    onMounted(loadList)

    return { filters, loadList, pagedList, page, pageSize, total, filtered, onPageChange, openCreate, openEdit, remove, toggleStatus, dialogVisible, form, save, isEdit, pointsDialogVisible, pointsForm, openPoints, applyPoints, cards, loadCards, bindCardId, unbindCard, newCardDialogVisible, newCardForm, openCreateCard, createCardAndBind, cardCount, cardByType, abbreviateCardNo, cardTypeLabel, cardTxDialogVisible, cardTxForm, openCardTx, submitCardTx }
  }
})
</script>
