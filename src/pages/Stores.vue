<template>
  <div>
    <el-card>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">门店管理</h3>
        <div>
          <el-button type="primary" @click="openCreate">新增门店</el-button>
        </div>
      </div>

      <el-table :data="list" stripe style="width:100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="门店名称" width="200" />
        <el-table-column prop="address" label="地址" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '营业中' : '休息中' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" plain @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="isEdit ? '编辑门店' : '新增门店'" v-model="dialogVisible">
      <el-form :model="form" :rules="rules" ref="storeForm" label-position="top">
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">营业中</el-radio>
            <el-radio :label="2">休息中</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from 'vue'
import { getStores, saveStores } from '../services/api'

export default defineComponent({
  name: 'Stores',
  setup() {
    const list = ref<any[]>([])
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const storeForm = ref()
    const form = reactive({ id: 0, name: '', address: '', phone: '', status: 1 })

    const rules = {
      name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
      address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
      phone: [{ required: true, message: '请输入电话', trigger: 'blur' }]
    }

    function loadList() {
      list.value = getStores()
    }

    function openCreate() {
      isEdit.value = false
      Object.assign(form, { id: 0, name: '', address: '', phone: '', status: 1 })
      dialogVisible.value = true
    }

    function openEdit(row: any) {
      isEdit.value = true
      Object.assign(form, row)
      dialogVisible.value = true
    }

    function save() {
      ;(storeForm.value as any).validate((valid: boolean) => {
        if (!valid) return
        const all = getStores()
        if (isEdit.value) {
          const idx = all.findIndex((s: any) => s.id === form.id)
          if (idx >= 0) all[idx] = { ...form }
        } else {
          const nid = (all.reduce((max: number, s: any) => Math.max(max, s.id), 0) || 0) + 1
          all.push({ ...form, id: nid })
        }
        saveStores(all)
        dialogVisible.value = false
        loadList()
      })
    }

    function remove(row: any) {
      if (!confirm('确认删除该门店？')) return
      const all = getStores()
      saveStores(all.filter((s: any) => s.id !== row.id))
      loadList()
    }

    onMounted(loadList)

    return { list, dialogVisible, isEdit, form, rules, storeForm, openCreate, openEdit, save, remove }
  }
})
</script>
