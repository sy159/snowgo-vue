<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// App.vue 仅作为路由容器，权限与动态路由的恢复由 router.beforeEach 统一处理
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
