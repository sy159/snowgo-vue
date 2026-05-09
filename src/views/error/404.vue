<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1 class="error-code">
        404
      </h1>
      <p class="error-message">
        页面不存在
      </p>
      <p class="error-description">
        您访问的页面可能已被移除或从未存在
      </p>
      <el-button type="primary" size="large" @click="goHome">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.not-found-content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #409EFF;
  margin: 0;
  line-height: 1;
}

.error-message {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 16px 0 8px;
}

.error-description {
  font-size: 14px;
  color: #909399;
  margin: 0 0 32px;
}
</style>
