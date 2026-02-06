import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Users from '../pages/Users.vue'
import Staff from '../pages/Staff.vue'
import Transactions from '../pages/Transactions.vue'
import Login from '../pages/Login.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/users', name: 'Users', component: Users },
  { 
    path: '/staff', 
    name: 'Staff', 
    component: Staff,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin',
    name: 'AdminSettings',
    component: () => import('../pages/AdminSettings.vue'),
    meta: { requiresAdmin: true }
  },
  { 
    path: '/transactions', 
    name: 'Transactions', 
    component: Transactions
  },
  // 弃用注册页面，UI入口已移除
  // { path: '/register', name: 'Register', component: () => import('../pages/Register.vue') },
  { path: '/cards', name: 'Cards', component: () => import('../pages/Cards.vue') },
  { path: '/leaderboards/points', name: 'PointsLeaderboard', component: () => import('../pages/PointsLeaderboard.vue') },
  { path: '/leaderboards/recharge', name: 'RechargeLeaderboard', component: () => import('../pages/RechargeLeaderboard.vue') },
  { path: '/mall', name: 'Mall', component: () => import('../pages/Mall.vue') },
  { path: '/login', name: 'Login', component: Login }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // If visiting Login page
  if (to.name === 'Login') {
    // If already authenticated, redirect to Users
    if (auth.isAuthenticated()) {
      next({ name: 'Users' })
    } else {
      next()
    }
    return
  }

  // If visiting Home (root path), decide based on auth state
  if (to.name === 'Home') {
    if (auth.isAuthenticated()) {
      // Already logged in -> go to Users page
      next({ name: 'Users' })
    } else {
      // Not logged in -> go to Login page
      next({ name: 'Login', query: { redirect: to.fullPath } })
    }
    return
  }

  // All other routes require authentication
  if (!auth.isAuthenticated()) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // Check admin role
  if (to.meta.requiresAdmin && !auth.isAdmin()) {
    next({ name: 'Home' })
    return
  }

  next()
})

export default router
