import { http } from '@/utils/request'

// 菜单信息
export interface MenuInfo {
  id: number
  parent_id: number
  menu_type: 'Dir' | 'Menu' | 'Btn'
  name: string
  path?: string
  icon?: string
  perms?: string
  sort_order: number
  created_at: string
  updated_at: string
  children?: MenuInfo[]
}

// 创建/更新菜单参数
export interface MenuParam {
  id?: number
  parent_id: number
  menu_type: 'Dir' | 'Menu' | 'Btn'
  name: string
  path?: string
  icon?: string
  perms?: string
  sort_order?: number
}

// 获取菜单树
export function getMenuList() {
  return http.get<MenuInfo[]>('/api/admin/account/menu')
}

// 创建菜单
export function createMenu(data: MenuParam) {
  return http.post<number>('/api/admin/account/menu', data)
}

// 更新菜单
export function updateMenu(data: MenuParam) {
  return http.put<number>('/api/admin/account/menu', data)
}

// 删除菜单
export function deleteMenuById(id: number) {
  return http.delete(`/api/admin/account/menu/${id}`)
}
