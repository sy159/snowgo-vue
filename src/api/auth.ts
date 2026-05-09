import { http } from '@/utils/request'

// 登录请求参数
export interface LoginParams {
  username: string
  password: string
}

// 登录响应
export interface LoginResult {
  access_token: string
  refresh_token: string
  access_expire_timestamp: number
  refresh_expire_timestamp: number
}

// 登录
export function login(data: LoginParams) {
  return http.post<LoginResult>('/api/admin/auth/login', data)
}

// 登出
export function logout() {
  return http.post('/api/admin/auth/logout')
}
