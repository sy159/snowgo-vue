import type { ApiResponse } from '@/types'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getRefreshToken, getToken, removeToken, setToken } from '@/utils/storage'
import router from '@/router'

// Token 刷新锁 + 请求队列
let isRefreshing = false
let refreshQueue: Array<{ resolve: (token: string) => void, reject: (err: unknown) => void }> = []

function onRefreshed(token: string) {
  refreshQueue.forEach(cb => cb.resolve(token))
  refreshQueue = []
}

function onRefreshFailed(err: unknown) {
  refreshQueue.forEach(cb => cb.reject(err))
  refreshQueue = []
}

async function doRefreshToken(): Promise<string> {
  const refresh_token = getRefreshToken()
  if (!refresh_token) {
    throw new Error('No refresh token')
  }

  const res = await axios.post<ApiResponse<{
    access_token: string
    refresh_token: string
    access_expire_timestamp: number
    refresh_expire_timestamp: number
  }>>(`${import.meta.env.VITE_API_BASE_URL}/api/admin/auth/refresh-token`, { refresh_token })

  const { access_token, refresh_token: newRefresh, access_expire_timestamp, refresh_expire_timestamp } = res.data.data
  setToken(access_token, newRefresh, access_expire_timestamp, refresh_expire_timestamp)
  return access_token
}

class Request {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // 请求拦截器：注入 token + 序列化数组参数为重复形式 (ids=1&ids=2)
    this.instance.interceptors.request.use(
      (config) => {
        const token = getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        // 自定义数组序列化：ids=[1,2] → ids=1&ids=2 (而非默认的 ids[]=1&ids[]=2)
        if (config.params && typeof config.params === 'object') {
          const parts: string[] = []
          for (const [key, value] of Object.entries(config.params)) {
            if (Array.isArray(value)) {
              value.forEach(v => parts.push(`${key}=${encodeURIComponent(String(v))}`))
            }
            else if (value !== undefined && value !== null && value !== '') {
              parts.push(`${key}=${encodeURIComponent(String(value))}`)
            }
          }
          config.paramsSerializer = () => parts.join('&')
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        const apiRes = response.data as ApiResponse

        // code === 0 表示成功
        if (apiRes.code === 0) {
          return apiRes
        }

        // 401 业务码：token 过期/无效
        if (apiRes.code === 401) {
          // 刷新 token 的接口本身 401，不重试
          if (response.config?.url?.includes('/auth/refresh-token')) {
            this.handleTokenExpired()
            return Promise.reject(new Error('登录已过期'))
          }

          // 尝试刷新 token
          if (!isRefreshing) {
            isRefreshing = true
            const retry = response.config
            return doRefreshToken()
              .then((newToken) => {
                onRefreshed(newToken)
                retry.headers.Authorization = `Bearer ${newToken}`
                return this.instance.request(retry) as unknown as ApiResponse
              })
              .catch((err) => {
                onRefreshFailed(err)
                this.handleTokenExpired()
                return Promise.reject(err)
              })
              .finally(() => {
                isRefreshing = false
              })
          }
          else {
            return new Promise((resolve, reject) => {
              refreshQueue.push({
                resolve: (token: string) => {
                  const retry = response.config
                  retry.headers.Authorization = `Bearer ${token}`
                  resolve(this.instance.request(retry))
                },
                reject,
              })
            }) as unknown as ApiResponse
          }
        }

        // 其他业务错误
        ElMessage.error(apiRes.msg || '请求失败')
        return Promise.reject(new Error(apiRes.msg || '请求失败'))
      },
      async (error) => {
        const { response, config } = error

        if (response?.status === 401 && !config?.url?.includes('/auth/refresh-token')) {
          if (!isRefreshing) {
            isRefreshing = true
            try {
              const newToken = await doRefreshToken()
              onRefreshed(newToken)
              config.headers.Authorization = `Bearer ${newToken}`
              return this.instance.request(config)
            }
            catch (refreshError) {
              onRefreshFailed(refreshError)
              this.handleTokenExpired()
              return Promise.reject(refreshError)
            }
            finally {
              isRefreshing = false
            }
          }
          else {
            return new Promise((resolve, reject) => {
              refreshQueue.push({
                resolve: (token: string) => {
                  config.headers.Authorization = `Bearer ${token}`
                  resolve(this.instance.request(config))
                },
                reject,
              })
            })
          }
        }
        else if (response) {
          this.handleHttpError(response.status, response.data?.msg)
        }
        else {
          ElMessage.error('网络异常，请检查网络连接')
        }
        return Promise.reject(error)
      },
    )
  }

  private handleTokenExpired(): void {
    removeToken()
    ElMessage.error('登录已过期，请重新登录')
    router.push('/login')
  }

  private handleHttpError(status: number, message?: string): void {
    switch (status) {
      case 401:
        this.handleTokenExpired()
        break
      case 403:
        ElMessage.error('没有权限访问')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 500:
        ElMessage.error('服务器错误')
        break
      default:
        ElMessage.error(message || '请求失败')
    }
  }

  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.get(url, config) as unknown as Promise<ApiResponse<T>>
  }

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.post(url, data, config) as unknown as Promise<ApiResponse<T>>
  }

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.put(url, data, config) as unknown as Promise<ApiResponse<T>>
  }

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.delete(url, config) as unknown as Promise<ApiResponse<T>>
  }
}

export const http = new Request()
