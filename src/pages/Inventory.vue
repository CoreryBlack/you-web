<template>
  <div>
    <el-card>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">油品库存</h3>
        <div>
          <el-button type="primary" @click="openCreate">新增罐存</el-button>
        </div>
      </div>

      <el-table :data="list" stripe style="width:100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="storeId" label="门店ID" width="100" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
             <el-tag :type="row.type==='gasoline'?'danger':'warning'">{{ row.type==='gasoline'?'汽油':'柴油' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current" label="当前库存 (L)" width="150">
           <template #default="{ row }">
              <span :style="{color: row.current < row.threshold ? 'red' : 'inherit'}">{{ row.current }}</span>
           </template>
        </el-table-column>
        <el-table-column prop="capacity" label="总容量 (L)" width="150" />
        <el-table-column label="库存比例" width="200">
           <template #default="{ row }">
              <el-progress :percentage="Number((row.current / row.capacity * 100).toFixed(1))" :status="row.current < row.threshold ? 'exception' : 'success'" />
           </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="openAdjust(row)">调整库存</el-button>
            <el-button size="small" type="primary" plain @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="isEdit ? '编辑罐存信息' : '新增罐存'" v-model="dialogVisible">
      <el-form :model="form" :rules="rules" ref="invForm" label-position="top">
        <el-form-item label="门店ID" prop="storeId">
          <el-input v-model.number="form.storeId" type="number" />
        </el-form-item>
        <el-form-item label="油品类型" prop="type">
          <el-select v-model="form.type">
            <el-option label="汽油" value="gasoline" />
            <el-option label="柴油" value="diesel" />
          </el-select>
        </el-form-item>
        <el-form-item label="总容量 (L)" prop="capacity">
          <el-input-number v-model="form.capacity" :min="1000" :step="1000" />
        </el-form-item>
        <el-form-item label="报警阈值 (L)" prop="threshold">
          <el-input-number v-model="form.threshold" :min="0" :step="100" />
        </el-form-item>
        <el-form-item label="当前库存 (L)" prop="current" v-if="!isEdit">
           <el-input-number v-model="form.current" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="库存调整" v-model="adjustVisible">
      <el-form :model="adjustForm" label-position="top">
        <el-form-item label="调整类型">
           <el-radio-group v-model="adjustForm.action">
             <el-radio label="add">进油(增加)</el-radio>
             <el-radio label="sub">损耗(减少)</el-radio>
           </el-radio-group>
        </el-form-item>
        <el-form-item label="数量 (L)">
           <el-input-number v-model="adjustForm.amount" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
         <el-button @click="adjustVisible = false">取消</el-button>
         <el-button type="primary" @click="submitAdjust">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from 'vue'
import { getInventory, saveInventory } from '../services/api'

export default defineComponent({
  name: 'Inventory',
  setup() {
    const list = ref<any[]>([])
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const invForm = ref()
    const adjustVisible = ref(false)
    
    const form = reactive({ id: 0, storeId: 1, type: 'gasoline', capacity: 10000, current: 0, threshold: 1000 })
    const adjustForm = reactive({ id: 0, action: 'add', amount: 0 })

    const rules = {
      storeId: [{ required: true, message: '必填', trigger: 'blur' }],
      capacity: [{ required: true, message: '必填', trigger: 'blur' }]
    }

    function loadList() {
      list.value = getInventory()
    }

    function openCreate() {
      isEdit.value = false
      Object.assign(form, { id: 0, storeId: 1, type: 'gasoline', capacity: 10000, current: 0, threshold: 1000 })
      dialogVisible.value = true
    }

    function openEdit(row: any) {
      isEdit.value = true
      Object.assign(form, row)
      dialogVisible.value = true
    }

    function save() {
      ;(invForm.value as any).validate((valid: boolean) => {
        if (!valid) return
        const all = getInventory()
        if (isEdit.value) {
            const idx = all.findIndex((x:any) => x.id === form.id)
            if (idx >= 0) all[idx] = { ...form }
        } else {
            const nid = (all.reduce((m:number, x:any) => Math.max(m, x.id), 0) || 0) + 1
            all.push({ ...form, id: nid })
        }
        saveInventory(all)
        dialogVisible.value = false
        loadList()
      })
    }

    function openAdjust(row: any) {
       adjustForm.id = row.id
       adjustForm.action = 'add'
       adjustForm.amount = 0
       adjustVisible.value = true
    }

    function submitAdjust() {
       const all = getInventory()
       const idx = all.findIndex((x:any) => x.id === adjustForm.id)
       if (idx >= 0) {
          const item = all[idx]
          if (adjustForm.action === 'add') {
             item.current += adjustForm.amount
             if (item.current > item.capacity) item.current = item.capacity
          } else {
             item.current -= adjustForm.amount
             if (item.current < 0) item.current = 0
          }
          saveInventory(all)
          loadList()
          adjustVisible.value = false
       }
    }

    onMounted(loadList)

    return { list, dialogVisible, isEdit, invForm, form, rules, openCreate, openEdit, save, adjustVisible, adjustForm, openAdjust, submitAdjust }
  }
})
</script>
