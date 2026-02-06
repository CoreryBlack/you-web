<template>
  <div>
    <el-card>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">油枪管理</h3>
        <div>
          <el-button type="primary" @click="openCreate">新增油枪</el-button>
        </div>
      </div>

      <el-table :data="list" stripe style="width:100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="油枪名称" width="150" />
        <el-table-column prop="storeId" label="所属门店ID" width="120" />
        <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
                <el-tag :type="row.type === 'gasoline' ? 'danger' : 'warning'">{{ row.type === 'gasoline' ? '汽油' : '柴油' }}</el-tag>
            </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
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

    <el-dialog :title="isEdit ? '编辑油枪' : '新增油枪'" v-model="dialogVisible">
      <el-form :model="form" :rules="rules" ref="pumpForm" label-position="top">
        <el-form-item label="油枪名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="所属门店ID" prop="storeId">
          <el-input v-model.number="form.storeId" type="number" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type">
            <el-option label="汽油" value="gasoline" />
            <el-option label="柴油" value="diesel" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
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
import { getPumps, savePumps } from '../services/api'

export default defineComponent({
  name: 'Pumps',
  setup() {
    const list = ref<any[]>([])
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const pumpForm = ref()
    const form = reactive({ id: 0, name: '', storeId: 1, type: 'gasoline', status: 1 })

    const rules = {
      name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
      storeId: [{ required: true, message: '请输入门店ID', trigger: 'blur' }]
    }

    function loadList() {
      list.value = getPumps()
    }

    function openCreate() {
      isEdit.value = false
      Object.assign(form, { id: 0, name: '', storeId: 1, type: 'gasoline', status: 1 })
      dialogVisible.value = true
    }

    function openEdit(row: any) {
      isEdit.value = true
      Object.assign(form, row)
      dialogVisible.value = true
    }

    function save() {
      ;(pumpForm.value as any).validate((valid: boolean) => {
        if (!valid) return
        const all = getPumps()
        if (isEdit.value) {
          const idx = all.findIndex((s: any) => s.id === form.id)
          if (idx >= 0) all[idx] = { ...form }
        } else {
          const nid = (all.reduce((max: number, s: any) => Math.max(max, s.id), 0) || 0) + 1
          all.push({ ...form, id: nid })
        }
        savePumps(all)
        dialogVisible.value = false
        loadList()
      })
    }

    function remove(row: any) {
      if (!confirm('确认删除该油枪？')) return
      const all = getPumps()
      savePumps(all.filter((s: any) => s.id !== row.id))
      loadList()
    }

    onMounted(loadList)

    return { list, dialogVisible, isEdit, form, rules, pumpForm, openCreate, openEdit, save, remove }
  }
})
</script>
