import type { MenuInfo } from '@/api/account/menu'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user'

export const usePermissionStore = defineStore('permission', () => {
  const menuTree = ref<MenuInfo[]>([])

  async function fetchMenuTree(force = false): Promise<void> {
    if (!force && menuTree.value.length > 0)
      return
    const userStore = useUserStore()
    // 直接使用用户权限接口返回的 menu_list，后端已按权限过滤
    menuTree.value = JSON.parse(JSON.stringify(userStore.menuList))
  }

  function reset(): void {
    menuTree.value = []
  }

  return {
    menuTree,
    fetchMenuTree,
    reset,
  }
})
