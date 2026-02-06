<template>
  <el-card>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="margin:0">积分商城</h3>
      <div>
        <el-button type="primary" @click="openCreate">新增商品</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="6" v-for="item in products" :key="item.id">
        <el-card style="margin-bottom:12px">
          <div style="min-height:80px">
            <strong>{{ item.name }}</strong>
            <div style="color:#999">所需积分：{{ item.points }}</div>
            <div style="margin-top:8px">库存：{{ item.stock }}</div>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <el-button size="small" type="primary" @click="redeem(item)" :disabled="item.stock<=0">兑换</el-button>
            <el-button size="small" plain @click="openEdit(item)">编辑</el-button>
            <el-button size="small" plain type="danger" @click="remove(item)">删除</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog :title="isEdit ? '编辑商品' : '新增商品'" v-model="dialogVisible">
      <el-form :model="form" label-position="top">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="所需积分">
          <el-input-number v-model="form.points" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { fetchProducts, createProduct, deleteProduct, createTransaction } from '../services/api'

export default defineComponent({
  name: 'Mall',
  setup() {
    const products = ref<any[]>([])
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const form = ref({ id: 0, name: '', points: 0, stock: 0, description: '' })

    async function load() {
      products.value = await fetchProducts()
    }

    function openCreate() {
      isEdit.value = false
      form.value = { id: 0, name: '', points: 0, stock: 0, description: '' }
      dialogVisible.value = true
    }

    function openEdit(item: any) {
      isEdit.value = true
      form.value = { ...item }
      dialogVisible.value = true
    }

    async function save() {
      if (!form.value.name) return alert('请输入商品名称')
      try {
        await createProduct(form.value)
        await load()
        dialogVisible.value = false
      } catch (e: any) {
        alert('保存失败: ' + (e.response?.data?.msg || e.message))
      }
    }

    async function remove(item: any) {
      if (!confirm('确认删除该商品？')) return
      try {
        await deleteProduct(item.id)
        await load()
      } catch (e: any) {
        alert('删除失败: ' + (e.response?.data?.msg || e.message))
      }
    }

    async function redeem(item: any) {
      const username = prompt('请输入兑换用户名（demo）')
      if (!username) return
      if (item.stock <= 0) return alert('库存不足')
      
      try {
        // 后端逻辑应包含积分扣减和交易记录，目前先手动记录交易及更新商品
        await createTransaction({
          user: username,
          type: 'redeem',
          amount: item.points,
          note: `兑换 ${item.name}`
        })
        
        // 更新本地状态模拟（实际应由后端返回新状态）
        item.stock -= 1
        await createProduct(item)
        alert('兑换成功')
      } catch (e: any) {
        alert('兑换失败: ' + (e.response?.data?.msg || e.message))
      }
    }

    onMounted(load)

    return { products, dialogVisible, form, isEdit, openCreate, openEdit, save, remove, redeem }
  }
})
</script>
