<template>
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f5f7fa;">
    <el-card style="width:420px;padding:24px;">
      <h3 style="text-align:center;margin-bottom:12px;">注册新用户</h3>
      <el-form :model="form" :rules="rules" ref="regForm" label-position="top" autocomplete="off">
        <!-- Hidden dummy fields to capture browser autofill and prevent filling visible inputs -->
        <div style="position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px; overflow: hidden;">
          <input name="username" autocomplete="username" />
          <input name="password" type="password" autocomplete="new-password" />
        </div>

        <el-form-item label="用户名" prop="username">
          <el-input name="register-username" v-model="form.username" autocomplete="off" :readonly="usernameReadonly" @focus="onFocusUsername" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input name="register-phone" v-model="form.phone" autocomplete="off" placeholder="用于登录，必填" />
        </el-form-item>

        <el-form-item label="姓名" prop="name">
          <el-input name="register-name" v-model="form.name" autocomplete="off" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input name="register-password" v-model="form.password" type="password" autocomplete="new-password" :readonly="passwordReadonly" @focus="onFocusPassword" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit">注册</el-button>
          <el-button plain @click="goLogin" style="margin-left:8px">返回登录</el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="message" :title="message" type="success" show-icon style="margin-top:12px" />
      <el-alert v-if="error" :title="error" type="error" show-icon style="margin-top:12px" />
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { staffRegister } from '../services/api'

export default defineComponent({
  name: 'Register',
  setup() {
    const router = useRouter()
    const regForm = ref()
    const loading = ref(false)
    const message = ref<string | null>(null)
    const error = ref<string | null>(null)

    const form = reactive({ username: '', phone: '', name: '', password: '' })

    // Prevent browser autofill by making visible inputs readonly until user focuses them
    const usernameReadonly = ref(true)
    const passwordReadonly = ref(true)

    const onFocusUsername = async () => {
      usernameReadonly.value = false
      await nextTick()
      const el = document.getElementsByName('register-username')[0] as HTMLInputElement | undefined
      if (el) el.focus()
    }

    const onFocusPassword = async () => {
      passwordReadonly.value = false
      await nextTick()
      const el = document.getElementsByName('register-password')[0] as HTMLInputElement | undefined
      if (el) el.focus()
    }

    const rules = {
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^\d+$/, message: '手机号必须为数字', trigger: 'blur' }
      ],
      name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    }

    const submit = () => {
      message.value = null
      error.value = null
      ;(regForm.value as any).validate(async (valid: boolean) => {
        if (!valid) return
        loading.value = true
            try {
              // 使用后端 staff 注册接口，确保 phone 以整数形式发送（后端期望 Integer）
              const payload = {
                // keep phone as string; backend will handle storage/type
                phone: String(form.phone),
                username: form.username,
                name: form.name,
                // 后端期望字段为 passwordHash；前端不做加密，直接把明文放入该字段
                passwordHash: form.password
              }
              const res = await staffRegister(payload)
              if (res && res.code === 0) {
                message.value = res.msg || '注册成功'
                setTimeout(() => router.push({ name: 'Login' }), 800)
              } else {
                throw new Error((res && res.msg) || '注册失败')
              }
            } catch (e: any) {
              error.value = e?.response?.data?.msg || e?.message || '注册失败'
            } finally {
              loading.value = false
            }
      })
    }

    const goLogin = () => router.push({ name: 'Login' })

    return { form, rules, submit, loading, message, error, regForm, goLogin, usernameReadonly, passwordReadonly, onFocusUsername, onFocusPassword }
  }
})
</script>
