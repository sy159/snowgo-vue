import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/storage'

const Layout = () => import('@/components/Layout/index.vue')

// ========== 基础路由（登录页、首页、404） ==========
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/dashboard',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页' },
      },
    ],
  },
  {
    path: '/',
    redirect: '/dashboard',
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

// ========== 动态路由注册 ==========
let dynamicRoutesRegistered = false
let registeredRouteNames: string[] = []

async function registerRoutes() {
  if (dynamicRoutesRegistered) return

  const { useUserStore } = await import('@/store')
  const userStore = useUserStore()
  if (!userStore.menuList.length) return

  const { buildRoutes } = await import('@/router/routeMap')
  const pageRoutes = buildRoutes(userStore.menuList)

  for (const route of pageRoutes) {
    router.addRoute(route)
    if (route.name) {
      registeredRouteNames.push(route.name as string)
    }
  }

  dynamicRoutesRegistered = true
}

export function removeDynamicRoutes() {
  for (const name of registeredRouteNames) {
    router.removeRoute(name)
  }
  registeredRouteNames = []
  dynamicRoutesRegistered = false
}

// ========== 路由守卫 ==========
router.beforeEach(async (to, _from) => {
  const token = getToken()

  if (!token) {
    if (to.path !== '/login')
      return '/login'
    return true
  }

  if (to.path === '/login')
    return '/dashboard'

  // 页面刷新后重新加载用户信息和动态路由
  const { useUserStore } = await import('@/store')
  const userStore = useUserStore()
  if (!userStore.permissions.length) {
    try {
      await userStore.fetchUserInfo()
      const { usePermissionStore } = await import('@/store')
      await usePermissionStore().fetchMenuTree()
    }
    catch {
      // fetchUserInfo / fetchMenuTree 中已通过 handleTokenExpired 做 location.replace
      // 这里 return false 取消当前导航，等待硬跳转
      return false
    }
  }

  const wasRegistered = dynamicRoutesRegistered
  await registerRoutes()

  // 刚注册完路由，需要重新导航让路由树重新匹配
  if (!wasRegistered && dynamicRoutesRegistered) {
    return to.fullPath
  }

  // 目标路由未注册（无权限）→ 由 catch-all 路由接管，显示 404
  if (to.name && to.name !== 'NotFound' && !router.hasRoute(to.name)) {
    return true
  }

  return true
})

export default router
