<template>
  <el-card>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="margin:0">积分排行榜</h3>
      <div>
        <el-button type="primary" plain @click="load">刷新</el-button>
      </div>
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
            <el-table-column prop="points" label="积分" width="120" />
          </el-table>
        </div>
        <!-- duplicate without header for seamless loop -->
        <div class="content">
          <el-table :data="list" stripe style="width:100%" v-loading="loading" :show-header="false" :height="null">
            <el-table-column label="排名" width="80">
              <template #default="{ row, $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="nickname" label="用户" width="240" />
            <el-table-column prop="phone" label="手机号" width="160" />
            <el-table-column prop="points" label="积分" width="120" />
          </el-table>
        </div>
      </div>
    </div>

    <div style="margin-top:12px;color:#666;font-size:13px">显示前 {{ list.length }} 名用户（按积分倒序）。悬停以暂停滚动。</div>
  </el-card>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { fetchUsers } from '../services/api'

export default defineComponent({
  name: 'PointsLeaderboard',
  setup() {
    const list = ref<any[]>([])
    const loading = ref(false)
    const scroller = ref<HTMLElement | null>(null)
    let timer: any = null
    let paused = false
    const speed = 1 // px per step

    function pause() { paused = true }
    function resume() { paused = false }

    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null }
    }

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
        if (el.scrollTop >= contentHeight) {
          el.scrollTop = 0
        }
      }, 40)
    }

    async function load() {
      loading.value = true
      try {
        // try to fetch users and use their `points` field
        const usersBody: any = await fetchUsers({ page: 1, pageSize: 10000 })
        let usersList: any[] = []
        if (Array.isArray(usersBody)) usersList = usersBody
        else if (usersBody && Array.isArray(usersBody.records)) usersList = usersBody.records
        else if (usersBody && Array.isArray(usersBody.list)) usersList = usersBody.list
        else usersList = usersBody && usersBody.list ? usersBody.list : []

        const normalized = usersList.map(u => ({
          id: u.user_id || u.userId || u.id,
          nickname: u.nickname || u.name || u.realName || '',
          phone: u.phone || '',
          points: Number(u.points || 0)
        }))

        normalized.sort((a, b) => b.points - a.points)
        list.value = normalized.slice(0, 100)
        // restart auto-scroll when data changes
        await nextTick()
        startAuto()
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      load()
    })

    onUnmounted(() => {
      stopAuto()
    })

    return { list, loading, load, scroller, pause, resume }
  }
})
</script>

<style scoped>
.leaderboard-wrap { }
.scroll-container { height: 360px; overflow: hidden; position: relative }
.scroll-container .content { width:100% }
.scroll-container .el-table__header { background: #fafafa }
</style>
