import { http } from '@/utils/request'

// 用户信息
export interface UserInfo {
  id: number
  username: string
  tel: string
  nickname: string
  email: string
  remark: string
  status: number
  created_by: number
  updated_by: number
  created_at: string
  updated_at: string
  role_list?: UserRole[]
}

// 用户角色
export interface UserRole {
  id: number
  name: string
  code: string
}

// 用户列表
export interface UserList {
  list: UserInfo[]
  total: number
}

// 用户列表查询条件
export interface UserListCondition {
  username?: string
  tel?: string
  status?: number
  offset: number
  limit: number
}

// 创建/更新用户参数
export interface UserParam {
  id?: number
  username: string
  tel: string
  nickname?: string
  email?: string
  password?: string
  remark?: string
  status?: number
  role_ids?: number[]
}

// 获取用户列表
export function getUserList(params: UserListCondition) {
  return http.get<UserList>('/api/admin/account/user', { params })
}

// 获取用户详情
export function getUserById(id: number) {
  return http.get<UserInfo>(`/api/admin/account/user/${id}`)
}

// 创建用户
export function createUser(data: UserParam) {
  return http.post<number>('/api/admin/account/user', data)
}

// 更新用户
export function updateUser(data: UserParam) {
  return http.put<number>('/api/admin/account/user', data)
}

// 删除用户
export function deleteUserById(id: number) {
  return http.delete(`/api/admin/account/user/${id}`)
}

// 重置密码
export function resetPwdById(id: number, password: string) {
  return http.post('/api/admin/account/user/pwd', { id, password })
}

// 用户权限响应（与后端 UserPermissionInfo 结构一致）
export interface UserPermissionInfo {
  id: number
  username: string
  tel: string
  nickname: string
  status: number
  email?: string
  remark?: string
  created_by?: number
  updated_by?: number
  role_list?: UserRole[]
  menu_list?: Array<{
    id: number
    parent_id: number
    menu_type: 'Dir' | 'Menu' | 'Btn'
    name: string
    path?: string
    icon?: string
    perms?: string
    sort_order: number
  }>
  permission_list?: Array<{
    id: number
    name: string
    perms: string
  }>
  created_at: string
  updated_at: string
}

// 获取用户权限
export function getUserPermission() {
  return http.get<UserPermissionInfo>('/api/admin/account/user/permission')
}
