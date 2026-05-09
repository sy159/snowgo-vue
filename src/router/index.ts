import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/storage'

const Layout = () => import('@/components/Layout/index.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'House' },
      },
    ],
  },
  {
    path: '/account',
    component: Layout,
    redirect: '/account/user',
    meta: { title: '账号管理', icon: 'UserFilled' },
    children: [
      {
        path: 'user',
        name: 'AccountUser',
        component: () => import('@/views/account/user/index.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'role',
        name: 'AccountRole',
        component: () => import('@/views/account/role/index.vue'),
        meta: { title: '角色管理' },
      },
      {
        path: 'menu',
        name: 'AccountMenu',
        component: () => import('@/views/account/menu/index.vue'),
        meta: { title: '菜单管理' },
      },
    ],
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/dict',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'dict',
        name: 'SystemDict',
        component: () => import('@/views/system/dict/index.vue'),
        meta: { title: '字典管理' },
      },
      {
        path: 'log',
        redirect: '/system/log/operation',
        meta: { title: '日志管理' },
        children: [
          {
            path: 'operation',
            name: 'SystemOperationLog',
            component: () => import('@/views/system/log/operation/index.vue'),
            meta: { title: '操作日志' },
          },
          {
            path: 'login',
            name: 'SystemLoginLog',
            component: () => import('@/views/system/log/login/index.vue'),
            meta: { title: '登录日志' },
          },
        ],
      },
    ],
  },
  // 404
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

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const token = getToken()

  // 更新页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - SnowGo`
  }

  if (to.path === '/login') {
    if (token) {
      next('/')
    }
    else {
      next()
    }
  }
  else {
    if (!token) {
      next('/login')
    }
    else {
      next()
    }
  }
})

export default router
