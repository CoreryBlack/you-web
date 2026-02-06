<template>
  <el-card>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="margin:0">交易记录</h3>
    </div>

    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
      <el-input v-model="filters.keyword" placeholder="按用户名/备注搜索" clearable style="width:260px" @keyup.enter="handleFilter" />
      <el-select v-model="filters.type" placeholder="类型" clearable style="width:220px">
        <el-option label="所有" :value="''" />
        <el-option label="油卡充值" :value="'card_recharge'" />
        <el-option label="支出" :value="'card_spend'" />
        <el-option label="积分增加" :value="'points_adjust'" />
        <el-option label="积分消费" :value="'redeem'" />
        <el-option label="退款" :value="'refund'" />
      </el-select>
      <el-date-picker v-model="filters.range" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
      <el-button type="primary" plain @click="handleFilter">筛选</el-button>
      <el-button type="success" plain @click="exportCsv">导出 CSV</el-button>
    </div>

    <el-table :data="list" stripe style="width:100%" v-loading="loading">
      <el-table-column label="交易单号ID" width="220">
        <template #default="{ row }">
          <div :title="row.id">{{ shortId(row.id) }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="user" label="用户" width="180" />
      <el-table-column prop="operator" label="操作人员" width="160" />
      <el-table-column prop="type" label="类型" width="140" />
      <el-table-column prop="amount" label="金额/积分" width="140" />
      <el-table-column prop="time" label="时间" width="200" />
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row)">详情</el-button>
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

    <el-dialog title="交易详情" v-model="detailVisible">
      <pre style="max-height:400px;overflow:auto">{{ detailRow ? JSON.stringify(detailRow, null, 2) : '' }}</pre>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from 'vue'
import { fetchTransactionsPaged } from '../services/api'

export default defineComponent({
  name: 'Transactions',
  setup() {
    const list = ref<any[]>([])
    const loading = ref(false)
    const filters = reactive({ keyword: '', type: '', range: null as any })
    const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
    const detailVisible = ref(false)
    const detailRow = ref<any | null>(null)

    async function loadList() {
      loading.value = true
      try {
        const params: any = {
          page: pagination.page,
          pageSize: pagination.pageSize
        }
        if (filters.keyword) params.keyword = filters.keyword
        if (filters.type) params.type = filters.type
        if (filters.range && filters.range.length === 2) {
          params.startDate = filters.range[0].toISOString().split('T')[0]
          params.endDate = filters.range[1].toISOString().split('T')[0]
        }
        const result = await fetchTransactionsPaged(params)
        list.value = result.list
        pagination.total = result.total
      } finally {
        loading.value = false
      }
    }

    function handleFilter() {
      pagination.page = 1
      loadList()
    }

    function handlePageChange(page: number) {
      pagination.page = page
      loadList()
    }

    function handleSizeChange(size: number) {
      pagination.pageSize = size
      pagination.page = 1
      loadList()
    }

    function viewDetail(row: any) {
      detailRow.value = row
      detailVisible.value = true
    }

    function shortId(id: any) {
      if (!id && id !== 0) return ''
      let s = typeof id === 'string' ? id : String(id)
      if (s.length <= 14) return s
      return `${s.slice(0,8)}…${s.slice(-4)}`
    }

    onMounted(loadList)

    async function exportCsv() {
      if (pagination.total === 0) return alert('没有可导出的记录')
      // 获取所有符合筛选条件的数据（不分页）
      const params: any = { page: 1, pageSize: pagination.total || 10000 }
      if (filters.keyword) params.keyword = filters.keyword
      if (filters.type) params.type = filters.type
      if (filters.range && filters.range.length === 2) {
        params.startDate = filters.range[0].toISOString().split('T')[0]
        params.endDate = filters.range[1].toISOString().split('T')[0]
      }
      const result = await fetchTransactionsPaged(params)
      const allData = result.list
      if (!allData || !allData.length) return alert('没有可导出的记录')
      const cols = ['id','user','operator','type','amount','note','time']
      const csv = [cols.join(',')].concat(allData.map((r: any) => cols.map(c => `"${(r[c] ?? '')}"`).join(','))).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions_${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }

    return { list, loading, filters, pagination, loadList, handleFilter, handlePageChange, handleSizeChange, detailVisible, detailRow, viewDetail, exportCsv, shortId }
  }
})
</script>
