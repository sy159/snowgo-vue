import type { RouteRecordRaw } from 'vue-router'
import type { MenuInfo } from '@/api/account/menu'
import Layout from '@/components/Layout/index.vue'

// Path → component mapping.
// Keys must match the `path` field returned by backend menu API (with leading /).
// Note: /dashboard is statically registered in router/index.ts, so it's excluded here.
export const routeMap: Record<string, () => Promise<unknown>> = {
  '/account/user': () => import('@/views/account/user/index.vue'),
  '/account/role': () => import('@/views/account/role/index.vue'),
  '/account/menu': () => import('@/views/account/menu/index.vue'),
  '/system/dict': () => import('@/views/system/dict/index.vue'),
  '/system/log/operation': () => import('@/views/system/log/operation/index.vue'),
  '/system/log/login': () => import('@/views/system/log/login/index.vue'),
}

// Derive a route name from path (e.g. /account/user → AccountUser)
export function pathToName(path: string): string {
  return path
    .replace(/^\//, '')
    .split('/')
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')
}

// Build RouteRecordRaw[] from backend menu tree.
// Each route wraps its page component in Layout so that sidebar/header/tabs render.
export function buildRoutes(menuList: MenuInfo[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  traverse(menuList)
  return routes

  function traverse(items: MenuInfo[]) {
    for (const item of items) {
      if (item.menu_type === 'Menu' && item.path && routeMap[item.path]) {
        const routeName = pathToName(item.path)
        routes.push({
          path: item.path,
          component: Layout,
          children: [
            {
              path: '',
              name: routeName,
              component: routeMap[item.path],
              meta: { title: item.name },
            },
          ],
        })
      }
      if (item.children?.length) {
        traverse(item.children)
      }
    }
  }
}
