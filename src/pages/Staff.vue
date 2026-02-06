<template>
  <div>
    <el-card>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">员工管理</h3>
        <div>
          <el-button type="primary" @click="openCreate">新增员工</el-button>
        </div>
      </div>

      <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center">
        <el-input v-model="filters.keyword" placeholder="按姓名搜索" clearable @clear="handleFilter" @keyup.enter="handleFilter" style="width:260px" />
        <el-select v-model="filters.role" placeholder="角色" clearable style="width:140px" @change="handleFilter">
          <el-option v-for="opt in roleOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-button type="primary" plain @click="handleFilter">查询</el-button>
      </div>

      <el-table :data="list" stripe style="width:100%" v-loading="loading">
        <el-table-column prop="staffId" label="工号" width="120" class-name="ellipsis" show-overflow-tooltip />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">{{ roleLabel(row.role) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">{{ statusLabel(row.status) }}</template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="180">
          <template #default="{ row }">{{ fmtDate(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">{{ fmtDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" :width="isWide ? 200 : 60">
          <template #default="{ row }">
            <div v-if="isWide">
              <el-button type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" plain @click="remove(row)">删除</el-button>
            </div>
            <div v-else>
              <el-dropdown @command="(cmd) => onDropdownCommand(cmd, row)">
                <el-button size="small" type="text" icon="el-icon-more" />
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="delete">删除</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
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
    </el-card>

    <el-dialog :title="isEdit ? '编辑员工' : '新增员工'" v-model="dialogVisible">
      <el-form :model="form" :rules="rules" ref="staffForm" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>

        <el-form-item label="密码" prop="passwordHash" v-if="!isEdit">
          <el-input v-model="form.passwordHash" type="password" placeholder="默认密码，首次登录可修改" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="选择角色">
            <el-option v-for="opt in roleOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>


        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status">
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { fetchStaffPaged, createStaff, updateStaff, deleteStaff } from '../services/api'

export default defineComponent({
  name: 'Staff',
  setup() {
    const list = ref<any[]>([])
    const loading = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const saving = ref(false)
    const staffForm = ref()
    const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

    const filters = reactive({ keyword: '', role: null as number | null })

    const roleOptions = [
      { label: '管理员', value: 1 },
      { label: '操作员', value: 2 },
    ]

    const statusOptions = [
      { label: '正常', value: 1 },
      { label: '停用', value: 2 }
    ]

    const form = reactive({ id: 0, staffId: '', username: '', phone: '', passwordHash: '', name: '', role: 2, status: 1 })

    const rules = {
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
      ],
      name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      role: [{ required: true, message: '请选择角色', trigger: 'change' }],
      
      passwordHash: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    }

    function roleLabel(v: number) {
      const found = roleOptions.find(r => r.value === v)
      return found ? found.label : ''
    }

    function statusLabel(v: number) {
      const found = statusOptions.find(s => s.value === v)
      return found ? found.label : ''
    }

    function fmtDate(v: string | null) {
      if (!v) return ''
      try {
        return new Date(v).toLocaleString()
      } catch {
        return v
      }
    }

    async function loadList() {
      loading.value = true
      try {
        const params: any = {
          page: pagination.page,
          pageSize: pagination.pageSize
        }
        if (filters.keyword) params.keyword = filters.keyword
        if (filters.role) params.role = filters.role
        const res = await fetchStaffPaged(params)
        list.value = res.list || []
        pagination.total = res.total || 0
      } catch (e) {
        console.error(e)
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

    function openCreate() {
      isEdit.value = false
      Object.assign(form, { id: 0, staffId: '', username: '', phone: '', passwordHash: '', name: '', role: 2, status: 1 })
      dialogVisible.value = true
    }

    function openEdit(row: any) {
      isEdit.value = true
      Object.assign(form, {
        id: row.id,
        staffId: row.staffId || row.staff_id,
        username: row.username,
        phone: row.phone,
        passwordHash: row.passwordHash || row.password_hash || row.password,
        name: row.name,
        role: row.role,
        
        status: row.status
      })
      dialogVisible.value = true
    }

    async function save() {
      const valid = await (staffForm.value as any).validate()
      if (!valid) return
      
      saving.value = true
      try {
        const payload: any = { ...form }
        if (isEdit.value) {
          await updateStaff(form.staffId, payload)
        } else {
          await createStaff(payload)
        }
        dialogVisible.value = false
        await loadList()
      } catch (e) {
        console.error(e)
      } finally {
        saving.value = false
      }
    }

    async function remove(row: any) {
      if (!confirm('确定删除该员工吗？')) return
      try {
        await deleteStaff(row.staffId || row.staff_id)
        await loadList()
      } catch (e) {
        console.error(e)
      }
    }

    const isWide = ref(window.innerWidth >= 1200)

    // Router 与 Auth store，用于客户端路由守卫
    const auth = useAuthStore()
    const router = useRouter()

    function updateWidth() {
      isWide.value = window.innerWidth >= 1200
    }

    onMounted(() => {
      // 如果未认证，跳转到登录页
      if (!auth.isAuthenticated()) {
        router.push('/login')
        return
      }

      loadList()
      window.addEventListener('resize', updateWidth)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', updateWidth)
    })

    function onDropdownCommand(cmd: string, row: any) {
      if (cmd === 'edit') openEdit(row)
      else if (cmd === 'delete') remove(row)
    }

    

    return {
      list,
      loading,
      filters,
      pagination,
      loadList,
      handleFilter,
      handlePageChange,
      handleSizeChange,
      roleOptions,
      statusOptions,
      roleLabel,
      statusLabel,
      fmtDate,
      dialogVisible,
      form,
      staffForm,
      rules,
      openCreate,
      openEdit,
      save,
      remove,
      isEdit,
      saving
      ,isWide,
      onDropdownCommand
    }
  }
})
</script>

<style scoped>
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
