import { http } from '@/utils/request'

// 操作日志信息
export interface OperationLogInfo {
  id: number
  operator_id: number
  operator_name: string
  operator_type: string
  resource: string
  resource_id: number
  action: string
  trace_id: string
  before_data: string
  after_data: string
  description: string
  ip: string
  created_at: string
}

// 操作日志列表
export interface OperationLogList {
  list: OperationLogInfo[]
  total: number
}

// 操作日志查询条件
export interface OperationLogCondition {
  operator_name?: string
  resource?: string
  action?: string
  start_time?: string
  end_time?: string
  offset: number
  limit: number
}

// 登录日志信息
export interface LoginLogInfo {
  id: number
  user_id: number
  username: string
  ip: string
  status: boolean
  message: string
  user_agent: string
  created_at: string
}

// 登录日志列表
export interface LoginLogList {
  list: LoginLogInfo[]
  total: number
}

// 登录日志查询条件
export interface LoginLogCondition {
  username?: string
  status?: boolean
  start_time?: string
  end_time?: string
  offset: number
  limit: number
}

// 获取操作日志列表
export function getOperationLogList(params: OperationLogCondition) {
  return http.get<OperationLogList>('/api/admin/system/log/operation', { params })
}

// 获取登录日志列表
export function getLoginLogList(params: LoginLogCondition) {
  return http.get<LoginLogList>('/api/admin/system/log/login', { params })
}
