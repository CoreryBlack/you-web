<template>
  <div>
    <el-container v-if="!isLogin" class="app-root">
      <el-header class="app-header">
        <div class="header-left">
          <el-button link @click="toggleCollapse" class="menu-toggle">
            <span v-if="!collapsed && !isMobile">☰</span>
            <span v-else-if="!isMobile">☷</span>
            <span v-else>☰</span>
          </el-button>
          <div class="app-title">加油站后台管理</div>
        </div>
        <div class="header-right">
          <el-button v-if="auth.isAuthenticated()" link class="username">{{ auth.user?.username || '管理员' }}</el-button>
          <el-button v-if="auth.isAuthenticated()" type="danger" @click="handleLogout">登出</el-button>
        </div>
      </el-header>

      <el-container class="app-body">
        <!-- desktop aside -->
        <el-aside v-if="!isMobile" :width="collapsed ? '64px' : '220px'" class="app-aside">
          <div class="aside-inner">
            <el-menu :default-active="activePath" class="el-menu-vertical-demo aside-top" router :collapse="collapsed">
              <el-menu-item index="/users">用户管理</el-menu-item>
              <el-menu-item v-if="auth.isAdmin()" index="/staff">员工管理</el-menu-item>
              <el-menu-item index="/transactions">交易记录</el-menu-item>
              <el-menu-item index="/leaderboards/points">积分排行榜</el-menu-item>
              <el-menu-item index="/leaderboards/recharge">累计充值排行榜</el-menu-item>
              <el-menu-item index="/cards">储油卡管理</el-menu-item>
              <el-menu-item index="/mall">积分商城</el-menu-item>
            </el-menu>

            <div class="aside-bottom">
              <el-menu class="el-menu-vertical-demo aside-bottom-menu" router :collapse="collapsed">
                <el-menu-item v-if="auth.isAdmin()" index="/admin">管理员设置</el-menu-item>
              </el-menu>
            </div>
          </div>
        </el-aside>

        <!-- mobile drawer menu -->
        <el-drawer v-model="visibleDrawer" direction="ltr" :with-header="false" size="220px">
          <div class="drawer-inner">
            <el-menu :default-active="activePath" class="el-menu-vertical-demo drawer-top" router>
              <el-menu-item index="/users">用户管理</el-menu-item>
              <el-menu-item v-if="auth.isAdmin()" index="/staff">员工管理</el-menu-item>
              <el-menu-item index="/transactions">交易记录</el-menu-item>
              <el-menu-item index="/leaderboards/points">积分排行榜</el-menu-item>
              <el-menu-item index="/leaderboards/recharge">累计充值排行榜</el-menu-item>
              <el-menu-item index="/mall">积分商城</el-menu-item>
            </el-menu>

            <el-menu class="el-menu-vertical-demo drawer-bottom" router>
              <el-menu-item v-if="auth.isAdmin()" index="/admin">管理员设置</el-menu-item>
            </el-menu>
          </div>
        </el-drawer>

        <el-main class="app-main">
          <div class="main-inner">
            <router-view />
          </div>
        </el-main>
      </el-container>
    </el-container>

    <div v-else style="min-height:100vh;">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter, useRoute } from 'vue-router'

export default defineComponent({
  name: 'App',
  setup() {
    const auth = useAuthStore()
    const router = useRouter()
    const route = useRoute()

    const collapsed = ref(false)
    const isMobile = ref(false)
    const visibleDrawer = ref(false)

    const toggleCollapse = () => {
      if (isMobile.value) {
        visibleDrawer.value = !visibleDrawer.value
      } else {
        collapsed.value = !collapsed.value
      }
    }

    const handleResize = () => {
      isMobile.value = window.innerWidth < 768
      // hide desktop aside on mobile and close any collapsed state to avoid tiny sidebar
      if (isMobile.value) {
        collapsed.value = false
      }
      // close drawer on large screens
      if (!isMobile.value) visibleDrawer.value = false
    }

    const handleLogout = async () => {
      await auth.logout()
      router.push({ name: 'Login' })
    }

    const activePath = computed(() => route.path)
    const isLogin = computed(() => {
      const name = route.name as string | undefined
      return name === 'Login' || name === 'Register' || route.path === '/login' || route.path === '/register'
    })

    onMounted(() => {
      handleResize()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return { auth, handleLogout, collapsed, toggleCollapse, activePath, isLogin, isMobile, visibleDrawer }
  }
})
</script>

<style scoped>
:root{
  --primary: #409EFF;
  --bg: #f5f7fa;
  --aside-bg: #fff;
  --border: #e6edf3;
}

.app-root{ min-height:100vh; display:flex; flex-direction:column; }

.app-header{ display:flex; align-items:center; justify-content:space-between; background:var(--primary); color:#fff; padding:0 16px; height:56px; }
.header-left{ display:flex; align-items:center; gap:12px; }
.menu-toggle{ color:#fff; padding:0 8px; }
.app-title{ font-weight:600; font-size:16px; color:#fff; }
.header-right .username{ color:#fff; margin-right:12px; }

.app-body{ flex:1; display:flex; overflow:hidden; background:var(--bg); }
.app-aside{ background:var(--aside-bg); border-right:1px solid var(--border); transition:width .2s ease; overflow:hidden; }
.app-main{ padding:16px; flex:1; overflow:auto; }

.main-inner{ max-width:1200px; margin:0 auto; width:100%; box-sizing:border-box; padding:8px 12px; }

@media (min-width:1400px){ .main-inner{ padding:16px 24px; } }

@media (max-width:991px){ .app-header{ padding:0 12px; height:56px; } .main-inner{ padding:8px; } .app-main{ padding:12px; } }

@media (max-width:767px){ .app-aside{ display:none; } .app-main{ padding:10px; } .app-title{ font-size:15px; } }

.app-aside .aside-inner{ display:flex; flex-direction:column; height:100%; }
.app-aside .aside-top{ flex:1; overflow:auto; }
.app-aside .aside-bottom{ border-top:1px solid var(--border); padding:8px; }
.app-aside .aside-bottom .el-menu{ border:0; }

.el-drawer .drawer-inner{ display:flex; flex-direction:column; height:100%; justify-content:space-between; }
.el-drawer .drawer-top{ overflow:auto; }
.el-drawer .drawer-bottom{ border-top:1px solid var(--border); padding:8px; }
.el-drawer .drawer-bottom .el-menu{ border:0; }

</style>
