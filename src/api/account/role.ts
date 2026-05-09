import { http } from '@/utils/request'

// 角色信息
export interface RoleInfo {
  id: number
  name: string
  code: string
  description: string
  created_at: string
  updated_at: string
  menu_ids?: number[]
}

// 角色列表
export interface RoleList {
  list: RoleInfo[]
  total: number
}

// 角色列表查询条件
export interface RoleListCondition {
  name?: string
  code?: string
  offset: number
  limit: number
}

// 创建/更新角色参数
export interface RoleParam {
  id?: number
  name: string
  code: string
  description?: string
  menu_ids?: number[]
}

// 获取角色列表
export function getRoleList(params: RoleListCondition) {
  return http.get<RoleList>('/api/admin/account/role', { params })
}

// 获取角色详情
export function getRoleById(id: number) {
  return http.get<RoleInfo>(`/api/admin/account/role/${id}`)
}

// 创建角色
export function createRole(data: RoleParam) {
  return http.post<number>('/api/admin/account/role', data)
}

// 更新角色
export function updateRole(data: RoleParam) {
  return http.put<number>('/api/admin/account/role', data)
}

// 删除角色
export function deleteRole(id: number) {
  return http.delete(`/api/admin/account/role/${id}`)
}
