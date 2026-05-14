import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/storage'

const Layout = () => import('@/components/Layout/index.vue')

// ========== 静态路由（全量注册，由后端菜单控制侧边栏可见性） ==========
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'House' },
      },
      {
        path: 'account/user',
        name: 'AccountUser',
        component: () => import('@/views/account/user/index.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'account/role',
        name: 'AccountRole',
        component: () => import('@/views/account/role/index.vue'),
        meta: { title: '角色管理' },
      },
      {
        path: 'account/menu',
        name: 'AccountMenu',
        component: () => import('@/views/account/menu/index.vue'),
        meta: { title: '菜单管理' },
      },
      {
        path: 'system/dict',
        name: 'SystemDict',
        component: () => import('@/views/system/dict/index.vue'),
        meta: { title: '字典管理' },
      },
      {
        path: 'system/log/operation',
        name: 'SystemOperationLog',
        component: () => import('@/views/system/log/operation/index.vue'),
        meta: { title: '操作日志' },
      },
      {
        path: 'system/log/login',
        name: 'SystemLoginLog',
        component: () => import('@/views/system/log/login/index.vue'),
        meta: { title: '登录日志' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', hidden: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ========== 路由守卫 ==========
router.beforeEach(async (to, _from) => {
  const token = getToken()

  if (!token) {
    if (to.path !== '/login')
      return '/login'
    return true
  }

  // 已登录访问登录页：跳转到首页
  if (to.path === '/login')
    return '/dashboard'

  // 页面刷新后重新加载用户信息和权限
  const { useUserStore } = await import('@/store')
  const userStore = useUserStore()
  if (!userStore.permissions.length) {
    await userStore.fetchUserInfo()
    const { usePermissionStore } = await import('@/store')
    await usePermissionStore().fetchMenuTree()
  }

  return true
})

export default router
