/** 统一 API 响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  msg: string
}

/** 分页请求参数 */
export interface PageParams {
  offset: number
  limit: number
}

/** 分页响应结构 */
export interface PageList<T> {
  list: T[]
  total: number
}
