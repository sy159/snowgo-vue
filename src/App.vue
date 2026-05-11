<script setup lang="ts">
import { onMounted } from 'vue'
import router from '@/router'
import { usePermissionStore, useUserStore } from '@/store'
import { getToken } from '@/utils/storage'

const userStore = useUserStore()
const permissionStore = usePermissionStore()

// 刷新页面时恢复用户信息和菜单
onMounted(async () => {
  const token = getToken()
  if (token && !userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
      await permissionStore.fetchMenuTree()
    }
    catch {
      userStore.resetState()
      router.push('/login')
    }
  }
})
</script>

<template>
  <router-view />
</template>
