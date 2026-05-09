import type { UserInfo } from '@/api/account/user'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserPermission } from '@/api/account/user'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import router from '@/router'
import { removeToken, setToken } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)
  const permissions = ref<string[]>([])

  // 登录
  async function login(username: string, password: string) {
    const res = await loginApi({ username, password })
    setToken(res.data.access_token, res.data.refresh_token, res.data.access_expire_timestamp, res.data.refresh_expire_timestamp)
    token.value = res.data.access_token
    await fetchUserInfo()
  }

  // 获取用户信息和权限
  async function fetchUserInfo() {
    try {
      const res = await getUserPermission()
      // 后端返回扁平结构：username, nickname, permission_list 等
      userInfo.value = {
        id: res.data.id,
        username: res.data.username,
        tel: res.data.tel,
        nickname: res.data.nickname,
        status: res.data.status,
        email: res.data.email,
        remark: res.data.remark,
        created_by: res.data.created_by,
        updated_by: res.data.updated_by,
        created_at: res.data.created_at,
        updated_at: res.data.updated_at,
        role_list: res.data.role_list,
      }
      permissions.value = res.data.permission_list?.map(p => p.perms) || []
    }
    catch (err) {
      console.error('[user] fetchUserInfo failed:', err)
    }
  }

  // 登出
  async function logout() {
    try {
      await logoutApi()
    }
    finally {
      resetState()
      router.push('/login')
    }
  }

  // 重置状态
  function resetState() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    removeToken()
  }

  // 检查是否有指定权限（传入单个权限或多个权限之一）
  function hasPermission(perms: string | string[]): boolean {
    const arr = Array.isArray(perms) ? perms : [perms]
    return arr.some(p => permissions.value.includes(p))
  }

  return {
    token,
    userInfo,
    permissions,
    login,
    logout,
    fetchUserInfo,
    resetState,
    hasPermission,
  }
})
