<template>
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f5f7fa;">
    <el-card style="width:400px;padding:24px;">
      <h3 style="text-align:center;margin-bottom:12px;">后台管理系统 登录</h3>
      <el-form :model="form" :rules="rules" ref="loginForm" label-position="top" autocomplete="off">
        <!-- Hidden dummy fields to capture browser autofill and prevent filling visible inputs -->
        <div style="position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px; overflow: hidden;">
          <input name="username" autocomplete="username" />
          <input name="password" type="password" autocomplete="current-password" />
        </div>
        <el-form-item label="登录方式" prop="loginType">
          <el-radio-group v-model="form.loginType">
            <el-radio label="username">用户名</el-radio>
            <el-radio label="phone">手机号</el-radio>
            <el-radio label="staffId">工号</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="labelForIdentifier" prop="username">
          <el-input name="login-identifier" v-model="form.username" autocomplete="off" :placeholder="placeholderForIdentifier" :readonly="usernameReadonly" @focus="onFocusIdentifier" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input name="login-password" v-model="form.password" type="password" autocomplete="off" :readonly="passwordReadonly" @focus="onFocusPassword" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit" style="width:100%">登录</el-button>
        </el-form-item>
      </el-form>
      <el-alert v-if="error" :title="error" type="error" show-icon style="margin-top:12px" />
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default defineComponent({
  name: 'Login',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const auth = useAuthStore()
    const loginForm = ref()
    const loading = ref(false)
    const error = ref<string | null>(null)

    const form = reactive({ loginType: 'username', username: '', password: '' })

    // Prevent browser autofill by making visible inputs readonly until user focuses them
    const usernameReadonly = ref(true)
    const passwordReadonly = ref(true)

    const onFocusIdentifier = async () => {
      usernameReadonly.value = false
      await nextTick()
      const el = document.getElementsByName('login-identifier')[0] as HTMLInputElement | undefined
      if (el) el.focus()
    }

    const onFocusPassword = async () => {
      passwordReadonly.value = false
      await nextTick()
      const el = document.getElementsByName('login-password')[0] as HTMLInputElement | undefined
      if (el) el.focus()
    }

    const rules = {
      loginType: [{ required: true, message: '请选择登录方式', trigger: 'change' }],
      username: [{ required: true, message: '请输入用户名/手机号/工号', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    }

    const labelForIdentifier = computed(() => {
      if (form.loginType === 'username') return '用户名'
      if (form.loginType === 'phone') return '手机号'
      return '工号'
    })

    const placeholderForIdentifier = computed(() => {
      if (form.loginType === 'username') return '请输入用户名'
      if (form.loginType === 'phone') return '请输入手机号'
      return '请输入工号'
    })

    const submit = () => {
      error.value = null
      ;(loginForm.value as any).validate(async (valid: boolean) => {
        if (!valid) return
        loading.value = true
        try {
          // pass loginType to auth.login so backend can distinguish identifier type
          await auth.login(form.username, form.password, form.loginType)
          // 登录成功后跳转：优先使用 redirect 参数，否则默认进入用户管理页面
          const redirect = (route.query.redirect as string) || '/users'
          router.replace(redirect)
        } catch (err: any) {
          error.value = err?.message || '登录失败'
        } finally {
          loading.value = false
        }
      })
    }

    return { form, rules, submit, loading, error, loginForm, labelForIdentifier, placeholderForIdentifier, usernameReadonly, passwordReadonly, onFocusIdentifier, onFocusPassword }
  }
})
</script>

