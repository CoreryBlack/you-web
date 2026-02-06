<template>
  <el-card>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="margin:0">储油卡管理</h3>
      <div>
        <el-button type="primary" @click="refresh">刷新</el-button>
        <el-button type="success" plain @click="batchRecharge">批量充值</el-button>
      </div>
    </div>

    <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center">
      <el-select v-model="filters.type" placeholder="卡类型" clearable style="width:160px">
        <el-option label="汽油卡" value="gasoline" />
        <el-option label="柴油卡" value="diesel" />
      </el-select>
      <el-input v-model="filters.keyword" placeholder="搜索手机号" clearable style="width:260px" />
      <el-button type="primary" plain @click="applyFilter">查询</el-button>
    </div>

    <el-table :data="list" stripe style="width:100%" v-loading="loading">
      <el-table-column prop="cardNo" label="卡号" width="220" />
      <el-table-column label="类型" width="120">
        <template #default="{ row }">{{ typeLabel(row.type || row.cardType) }}</template>
      </el-table-column>
      <el-table-column label="归属用户" width="200">
        <template #default="{ row }">
          <div>{{ row.ownerName || '' }}</div>
          <div style="color:#999;font-size:12px">{{ row.ownerPhone || row.userId || '' }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="balance" label="余额" width="120" />
      <el-table-column label="操作" width="320">
        <template #default="{ row }">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:nowrap;white-space:nowrap">
            <el-button size="small" @click="openTx(row, 'recharge')">充值</el-button>
            <el-button size="small" plain @click="openTx(row, 'spend')">支出</el-button>
            <el-button size="small" plain type="warning" @click="openTx(row, 'refund')">退款</el-button>
            <el-button size="small" plain type="danger" @click="unbind(row)">解绑</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div style="display:flex;justify-content:flex-end;margin-top:16px">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog title="卡交易" v-model="txVisible">
      <el-form :model="txForm" label-position="top">
        <el-form-item label="卡号">
          <div>{{ txForm.card?.cardNo }}</div>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="txForm.mode" placeholder="选择类型">
            <el-option label="充值" value="recharge" />
            <el-option label="支出" value="spend" />
            <el-option label="退款" value="refund" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input v-model="txForm.amount" type="number" :disabled="(txForm.mode === 'recharge' || txForm.mode === 'spend') && txForm.preset !== 'other'" />
          <div v-if="txForm.mode === 'recharge' || txForm.mode === 'spend'" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            <el-button size="mini" :type="txForm.preset===50 ? 'primary' : 'default'" @click="(txForm.amount = 50, txForm.preset = 50)">50</el-button>
            <el-button size="mini" :type="txForm.preset===100 ? 'primary' : 'default'" @click="(txForm.amount = 100, txForm.preset = 100)">100</el-button>
            <el-button size="mini" :type="txForm.preset===200 ? 'primary' : 'default'" @click="(txForm.amount = 200, txForm.preset = 200)">200</el-button>
            <el-button size="mini" :type="txForm.preset===500 ? 'primary' : 'default'" @click="(txForm.amount = 500, txForm.preset = 500)">500</el-button>
            <el-button size="mini" :type="txForm.preset==='other' ? 'primary' : 'default'" @click="(txForm.preset = 'other', txForm.amount = 0)">其他</el-button>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="txForm.note" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="txVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTx">提交</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from 'vue'
import { fetchCardsPaged, fetchUsers, adjustCardBalance, updateCard } from '../services/api'

export default defineComponent({
  name: 'Cards',
  setup() {
    const list = ref<any[]>([])
    const loading = ref(false)
    const filters = ref({ type: '', keyword: '' })
    const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
    const txVisible = ref(false)
    const txForm = ref({ card: null as any, amount: 0, note: '', mode: 'recharge', preset: 'other' })

    async function load() {
      loading.value = true
      try {
        const params: any = {
          page: pagination.page,
          pageSize: pagination.pageSize
        }
        if (filters.value.keyword) params.keyword = filters.value.keyword
        if (filters.value.type) params.type = filters.value.type
        
        const cardsRes = await fetchCardsPaged(params)
        const raw = cardsRes.list || []
        pagination.total = cardsRes.total || 0

        // try fetching users for owner mapping
        let usersBody: any = []
        try {
          usersBody = await fetchUsers({ page: 1, size: 10000 })
        } catch (e) {
          console.warn('fetchUsers failed in Cards.load, continuing without owner mapping', e)
          usersBody = []
        }

        let usersList: any[] = []
        if (Array.isArray(usersBody)) usersList = usersBody
        else if (usersBody && Array.isArray(usersBody.records)) usersList = usersBody.records
        else if (usersBody && Array.isArray(usersBody.list)) usersList = usersBody.list
        else usersList = []

        const userMap: Record<string, any> = {}
        usersList.forEach(u => {
          const id = u.userId || u.user_id || u.id || String(u.ID || '')
          userMap[String(id)] = { name: u.nickname || u.realName || u.username || u.name || '', phone: u.phone || '' }
        })

        // normalize to include balanceCents (分) and balance (元)
        list.value = raw.map((x: any, idx: number) => {
          const idVal = x.id || x.card_id || x.cardNo || idx + 1
          const cardNoVal = x.cardNo || x.card_no || x.card || ''
          const bc = typeof x.balance_cents !== 'undefined'
            ? Number(x.balance_cents)
            : (typeof x.balanceCents !== 'undefined'
              ? Number(x.balanceCents)
              : (typeof x.balance !== 'undefined' ? Math.round(Number(x.balance) * 100) : 0))
          // normalize type
          let t: any = 'gasoline'
          if (typeof x.cardType !== 'undefined') {
            t = x.cardType === 1 ? 'gasoline' : x.cardType === 2 ? 'diesel' : String(x.cardType)
          } else if (x.card_type) {
            t = x.card_type === 1 ? 'gasoline' : x.card_type === 2 ? 'diesel' : String(x.card_type)
          } else if (x.type) {
            t = String(x.type)
          }
          const uid = x.userId || x.user_id || x.userid || x.user || null
          const owner = uid ? userMap[String(uid)] : null
          return { ...x, id: idVal, cardNo: cardNoVal, balanceCents: bc, balance: bc / 100, type: t, ownerName: owner?.name || '', ownerPhone: owner?.phone || '' }
        })
      } finally {
        loading.value = false
      }
    }

    function handleFilter() {
      pagination.page = 1
      load()
    }

    function handlePageChange(page: number) {
      pagination.page = page
      load()
    }

    function handleSizeChange(size: number) {
      pagination.pageSize = size
      pagination.page = 1
      load()
    }

    function typeLabel(v: any) {
      if (v === 1 || String(v) === '1') return '汽油'
      if (v === 2 || String(v) === '2') return '柴油'
      const s = String(v || '').toLowerCase()
      if (s.includes('gas') || s.includes('汽')) return '汽油'
      if (s.includes('dies') || s.includes('柴')) return '柴油'
      return String(v || '')
    }

    function refresh() { load() }

    function applyFilter() {
      handleFilter()
    }

    function openTx(card: any, mode: 'recharge' | 'spend' | 'refund') {
      txForm.value.card = card
      txForm.value.amount = 0
      txForm.value.note = ''
      txForm.value.mode = mode
      txForm.value.preset = 'other'
      txVisible.value = true
    }

    async function submitTx() {
      const c = txForm.value.card
      if (!c) return
      const amt = Number(txForm.value.amount || 0)
      if (!amt && amt !== 0) return alert('请输入有效金额')
      
      let deltaCents = 0
      if (txForm.value.mode === 'spend') {
        if ((c.balance || 0) < amt) return alert('余额不足')
        deltaCents = -Math.round(amt * 100)
      } else {
        deltaCents = Math.round(amt * 100)
      }

      try {
        const cardNoVar = c.cardNo || c.card_no || c.card || String(c.id || '')
        const res = await adjustCardBalance(cardNoVar, deltaCents, txForm.value.note)
        if (!res || res.code !== 0) {
          return alert((res && res.msg) || '调整失败')
        }
        
        txVisible.value = false
        await load()
      } catch (e: any) {
        alert('调整失败: ' + (e.response?.data?.msg || e.message))
      }
    }

    async function unbind(row: any) {
      if (!confirm('确认解绑该卡？')) return
      try {
        await updateCard(row.cardNo, { user_id: null })
        await load()
      } catch (e: any) {
        alert('解绑失败: ' + (e.response?.data?.msg || e.message))
      }
    }

    async function batchRecharge() {
      const amt = Number(prompt('每张卡充值金额：', '100') || 0)
      if (!amt) return
      try {
        // 因后端暂无批量接口，循环调用（生产环境应提供批量接口）
        for (const c of list.value) {
          await adjustCardBalance(c.cardNo, Math.round(amt * 100), '批量充值')
        }
        alert('批量充值成功')
        await load()
      } catch (e: any) {
        alert('批量充值部分失败: ' + (e.response?.data?.msg || e.message))
      }
    }

    onMounted(load)
    return { list, loading, filters, pagination, applyFilter, refresh, handlePageChange, handleSizeChange, txVisible, txForm, openTx, submitTx, unbind, batchRecharge, typeLabel }
  }
})
</script>
