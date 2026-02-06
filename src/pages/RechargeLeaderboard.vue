<template>
  <el-card>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="margin:0">累计充值排行榜</h3>
      <div>
        <el-button type="primary" plain @click="load">刷新</el-button>
      </div>
    </div>

    <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center">
      <el-input-number v-model="topN" :min="1" :max="1000" label="显示条数" />
    </div>

    <div class="leaderboard-wrap">
      <div class="scroll-container" ref="scroller" @mouseenter="pause" @mouseleave="resume">
        <div class="content">
          <el-table :data="list" stripe style="width:100%" v-loading="loading" :height="null">
            <el-table-column label="排名" width="80">
              <template #default="{ row, $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="nickname" label="用户" width="240" />
            <el-table-column prop="phone" label="手机号" width="160" />
            <el-table-column prop="total" label="累计充值(元)" width="160" />
            <el-table-column prop="count" label="充值次数" width="120" />
          </el-table>
        </div>
        <div class="content">
          <el-table :data="list" stripe style="width:100%" v-loading="loading" :show-header="false" :height="null">
            <el-table-column label="排名" width="80">
              <template #default="{ row, $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="nickname" label="用户" width="240" />
            <el-table-column prop="phone" label="手机号" width="160" />
            <el-table-column prop="total" label="累计充值(元)" width="160" />
            <el-table-column prop="count" label="充值次数" width="120" />
          </el-table>
        </div>
      </div>
    </div>

    <div style="margin-top:12px;color:#666;font-size:13px">按用户统计所有类型为 `card_recharge` 的交易并按金额倒序。悬停以暂停滚动。</div>
  </el-card>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { fetchTransactionsPaged } from '../services/api'

export default defineComponent({
  name: 'RechargeLeaderboard',
  setup() {
    const list = ref<any[]>([])
    const loading = ref(false)
    const topN = ref(50)
    const scroller = ref<HTMLElement | null>(null)
    let timer: any = null
    let paused = false
    const speed = 1

    function pause() { paused = true }
    function resume() { paused = false }

    function stopAuto() { if (timer) { clearInterval(timer); timer = null } }

    async function startAuto() {
      await nextTick()
      stopAuto()
      const el = scroller.value
      if (!el) return
      const contentHeight = el.scrollHeight / 2
      if (contentHeight <= el.clientHeight) return
      timer = setInterval(() => {
        if (paused) return
        el.scrollTop = el.scrollTop + speed
        if (el.scrollTop >= contentHeight) el.scrollTop = 0
      }, 40)
    }

    async function load() {
      loading.value = true
      try {
        // fetch all recharge transactions (backend small, so request a large pageSize)
        const res = await fetchTransactionsPaged({ type: 'card_recharge', page: 1, pageSize: 10000 })
        const txs = res.list || []

        const map = new Map()
        txs.forEach((t: any) => {
          const raw = t._raw || {}
          const uid = raw.userId ?? raw.user_id ?? raw.userid ?? raw.user ?? t.user ?? 'unknown'
          const name = t.user || t.nickname || raw.userName || ''
          const phone = raw.phone || ''
          const amount = Number(t.amount ?? raw.amount ?? 0) || 0
          const key = String(uid)
          if (!map.has(key)) map.set(key, { userId: uid, nickname: name, phone, total: 0, count: 0 })
          const cur = map.get(key)
          cur.total = Number(cur.total || 0) + Number(amount)
          cur.count = (cur.count || 0) + 1
        })

        const arr = Array.from(map.values())
        arr.sort((a: any, b: any) => Number(b.total) - Number(a.total))
        list.value = arr.slice(0, topN.value)
        await nextTick()
        startAuto()
      } finally {
        loading.value = false
      }
    }

    onMounted(() => { load() })
    onUnmounted(() => { stopAuto() })

    return { list, loading, load, topN, scroller, pause, resume }
  }
})
</script>

<style scoped>
.leaderboard-wrap { }
.scroll-container { height: 360px; overflow: hidden; position: relative }
.scroll-container .content { width:100% }
.scroll-container .el-table__header { background: #fafafa }
</style>
