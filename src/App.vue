<script setup lang="ts">
import { onMounted } from 'vue'
import router from '@/router'
import { usePermissionStore, useUserStore } from '@/store'
import { getToken } from '@/utils/storage'

const userStore = useUserStore()
const permissionStore = usePermissionStore()

onMounted(async () => {
  const token = getToken()
  if (token && !userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
      await permissionStore.fetchMenuTree()
    }
    catch {
      // Token 无效或过期，清除状态并跳转登录
      userStore.resetState()
      router.push('/login')
    }
  }
  else if (token && permissionStore.menuTree.length === 0) {
    await permissionStore.fetchMenuTree()
  }
})
</script>

<template>
  <router-view />
</template>
