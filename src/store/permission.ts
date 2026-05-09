import type { MenuInfo } from '@/api/account/menu'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMenuList } from '@/api/account/menu'

export const usePermissionStore = defineStore('permission', () => {
  const menuTree = ref<MenuInfo[]>([])

  async function fetchMenuTree(): Promise<void> {
    if (menuTree.value.length > 0)
      return
    const res = await getMenuList()
    menuTree.value = res.data
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
