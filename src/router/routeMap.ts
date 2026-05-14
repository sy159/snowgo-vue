import type { RouteRecordRaw } from 'vue-router'
import type { MenuInfo } from '@/api/account/menu'

// Path → component mapping.
// Keys must match the `path` field returned by backend menu API (with leading /).
export const routeMap: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/views/dashboard/index.vue'),
  '/account/user': () => import('@/views/account/user/index.vue'),
  '/account/role': () => import('@/views/account/role/index.vue'),
  '/account/menu': () => import('@/views/account/menu/index.vue'),
  '/system/dict': () => import('@/views/system/dict/index.vue'),
  '/system/log/operation': () => import('@/views/system/log/operation/index.vue'),
  '/system/log/login': () => import('@/views/system/log/login/index.vue'),
}

// Derive a unique route name from path (e.g. /account/user → AccountUser)
export function pathToName(path: string): string {
  return path
    .replace(/^\//, '')
    .split('/')
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')
}

// Build flat RouteRecordRaw[] — no Layout wrapper, just direct component routes.
export function buildRoutes(menuList: MenuInfo[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  traverse(menuList)
  return routes

  function traverse(items: MenuInfo[]) {
    for (const item of items) {
      if (item.menu_type === 'Menu' && item.path && routeMap[item.path]) {
        routes.push({
          path: item.path,
          name: pathToName(item.path),
          component: routeMap[item.path],
          meta: { title: item.name },
        })
      }
      if (item.children?.length) {
        traverse(item.children)
      }
    }
  }
}
