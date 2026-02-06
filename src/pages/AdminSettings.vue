<template>
  <div class="admin-settings">
    <el-card>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3>管理员设置 — 定价</h3>
      </div>

      <el-form :model="form" label-width="160px" style="margin-top:16px;max-width:640px">
        <fieldset style="border:1px solid #eef; padding:12px; margin-bottom:12px">
          <legend style="padding:0 8px">汽油价格（元 / L）</legend>
          <el-form-item label="92#">
            <el-input-number v-model="form.gas92" :min="0" :step="0.01" :precision="2" controls-position="right"></el-input-number>
          </el-form-item>
          <el-form-item label="95#">
            <el-input-number v-model="form.gas95" :min="0" :step="0.01" :precision="2" controls-position="right"></el-input-number>
          </el-form-item>
          <el-form-item label="98#">
            <el-input-number v-model="form.gas98" :min="0" :step="0.01" :precision="2" controls-position="right"></el-input-number>
          </el-form-item>
        </fieldset>

        <fieldset style="border:1px solid #eef; padding:12px; margin-bottom:12px">
          <legend style="padding:0 8px">柴油价格（元 / L）</legend>
          <el-form-item label="0#">
            <el-input-number v-model="form.diesel0" :min="0" :step="0.01" :precision="2" controls-position="right"></el-input-number>
          </el-form-item>
          <el-form-item label="-10#">
            <el-input-number v-model="form.diesel_m10" :min="0" :step="0.01" :precision="2" controls-position="right"></el-input-number>
          </el-form-item>
        </fieldset>

        <el-form-item label="积分规则（1 元 = x 点）">
          <el-input-number v-model="form.pointsPerYuan" :min="0" :step="0.1" :precision="2" controls-position="right"></el-input-number>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="save" :loading="saving">保存设置</el-button>
          <el-button @click="load">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted } from 'vue'
import { fetchAdminSettings, saveAdminSettings } from '../services/api'

export default defineComponent({
  name: 'AdminSettings',
  setup() {
    const form = reactive({
      gas92: 7.0,
      gas95: 7.6,
      gas98: 8.2,
      diesel0: 6.5,
      diesel_m10: 6.3,
      // 每 1 元可兑换的积分数
      pointsPerYuan: 1.0
    })

    const saving = ref(false)

    const load = async () => {
      try {
        const settings = await fetchAdminSettings()
        if (!settings) return

        // 支持后端返回 { gasoline: {...}, diesel: {...}, pointsRate }
        if (settings.gasoline && typeof settings.gasoline === 'object') {
          form.gas92 = Number(settings.gasoline['92'] ?? settings.gasoline['92#'] ?? form.gas92)
          form.gas95 = Number(settings.gasoline['95'] ?? settings.gasoline['95#'] ?? form.gas95)
          form.gas98 = Number(settings.gasoline['98'] ?? settings.gasoline['98#'] ?? form.gas98)
        } else {
          // 兼容旧单值字段
          form.gas92 = Number(settings.gas92 ?? settings.gasPrice ?? settings.oilPrice ?? form.gas92)
          form.gas95 = Number(settings.gas95 ?? form.gas95)
          form.gas98 = Number(settings.gas98 ?? form.gas98)
        }

        if (settings.diesel && typeof settings.diesel === 'object') {
          form.diesel0 = Number(settings.diesel['0'] ?? settings.diesel['0#'] ?? form.diesel0)
          form.diesel_m10 = Number(settings.diesel['-10'] ?? settings.diesel['-10#'] ?? form.diesel_m10)
        } else {
          form.diesel0 = Number(settings.diesel0 ?? form.diesel0)
          form.diesel_m10 = Number(settings.diesel_m10 ?? form.diesel_m10)
        }

        // 支持新命名 pointsPerYuan / points_per_yuan，也兼容旧命名 pointsRate / points_rate
        form.pointsPerYuan = Number(
          settings.pointsPerYuan ?? settings.points_per_yuan ?? settings.pointsRate ?? settings.points_rate ?? form.pointsPerYuan
        )
      } catch (e) {
        // ignore
      }
    }

    const save = async () => {
      saving.value = true
      try {
        const payload: any = {
          gasoline: {
            '92': form.gas92,
            '95': form.gas95,
            '98': form.gas98
          },
          diesel: {
            '0': form.diesel0,
            '-10': form.diesel_m10
          },
          pointsPerYuan: form.pointsPerYuan
        }

        await saveAdminSettings(payload)
        ;(window as any).$message?.success('设置已保存')
      } catch (e) {
        ;(window as any).$message?.error('保存失败')
      } finally {
        saving.value = false
      }
    }

    onMounted(() => {
      load()
    })

    return { form, save, load, saving }
  }
})
</script>

<style scoped>
.admin-settings { padding: 8px; }
</style>
