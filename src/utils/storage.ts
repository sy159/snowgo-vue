const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const ACCESS_EXPIRE_KEY = 'access_expire_timestamp'
const REFRESH_EXPIRE_KEY = 'refresh_expire_timestamp'

// Token 操作
export function setToken(accessToken: string, refreshToken: string, accessExpire: number, refreshExpire: number): void {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(ACCESS_EXPIRE_KEY, String(accessExpire))
  localStorage.setItem(REFRESH_EXPIRE_KEY, String(refreshExpire))
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(ACCESS_EXPIRE_KEY)
  localStorage.removeItem(REFRESH_EXPIRE_KEY)
}

// 通用 localStorage 封装
export function getStorageItem<T>(key: string): T | null {
  const item = localStorage.getItem(key)
  if (!item)
    return null
  try {
    return JSON.parse(item) as T
  }
  catch {
    return null
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
}

export function removeStorageItem(key: string): void {
  localStorage.removeItem(key)
}
