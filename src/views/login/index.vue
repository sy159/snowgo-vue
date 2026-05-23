<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const currentYear = new Date().getFullYear()

const loginForm = reactive({
  username: import.meta.env.DEV ? 'admin' : '',
  password: import.meta.env.DEV ? '123456' : '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin(): Promise<void> {
  if (!formRef.value)
    return
  await formRef.value.validate(async (valid) => {
    if (!valid)
      return
    loading.value = true
    try {
      await userStore.login(loginForm.username, loginForm.password)
      ElMessage.success('登录成功')
      router.push('/')
    }
    catch (err) {
      console.error('[login] login failed:', err)
    }
    finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <div class="login-container">
    <!-- 左侧品牌区域 -->
    <div class="login-brand">
      <div class="brand-content">
        <h1 class="brand-title">
          SnowGo
        </h1>
        <p class="brand-subtitle">
          企业管理后台
        </p>
        <div class="brand-features">
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span>安全可靠的权限管理</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <span>灵活的菜单与字典配置</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span>完整的操作日志追踪</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-form-wrapper">
      <div class="login-form-card">
        <div class="form-header">
          <h2 class="form-title">
            欢迎登录
          </h2>
          <p class="form-subtitle">
            请输入您的账号信息
          </p>
        </div>

        <el-form ref="formRef" :model="loginForm" :rules="rules" class="login-form" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <div class="form-label">
              用户名
            </div>
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item prop="password">
            <div class="form-label">
              密码
            </div>
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              native-type="submit"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <p>© {{ currentYear }} SnowGo. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  background: var(--bg-page);
}

/* ===== 左侧品牌区域 ===== */
.login-brand {
  flex: 1;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    top: -100px;
    right: -100px;
  }

  &::after {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    bottom: -80px;
    left: -80px;
  }
}

.brand-content {
  position: relative;
  z-index: 1;
  max-width: 400px;
}

.brand-title {
  font-size: 48px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 48px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
}

/* ===== 右侧登录表单 ===== */
.login-form-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-form-card {
  width: 100%;
  max-width: 420px;
}

.form-header {
  margin-bottom: 40px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.form-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

.login-form {
  .form-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  :deep(.el-form-item) {
    margin-bottom: 24px;
  }

  :deep(.el-input__wrapper) {
    background-color: var(--bg-surface);
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-md);
    padding: 0 14px;
    height: 44px;
    box-shadow: none !important;
    transition: all var(--transition-fast);
  }

  :deep(.el-input__wrapper:hover) {
    border-color: var(--color-gray-300);
  }

  :deep(.el-input__wrapper.is-focus) {
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }

  :deep(.el-input__inner) {
    height: 44px;
    line-height: 44px;
    font-size: 14px;
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 1px;
  border-radius: var(--radius-md);
  margin-top: 8px;
}

.form-footer {
  margin-top: 40px;
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--color-gray-200);
}

.form-footer p {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .login-brand {
    display: none;
  }

  .login-form-wrapper {
    flex: 1;
  }

  .login-form-card {
    max-width: 400px;
  }
}

@media (max-width: 768px) {
  .login-form-wrapper {
    padding: 24px;
  }

  .form-title {
    font-size: 24px;
  }
}
</style>
