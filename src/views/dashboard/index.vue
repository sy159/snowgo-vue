<script setup lang="ts">
import {
  Clock,
  Connection,
  Document,
  List,
  Monitor,
  Setting,
  User,
} from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
})

// 当前时间（实时）
const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer)
    clearInterval(timer)
})

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN')
}

// 统计数据（占位数据）
const statsData = [
  { label: '用户总数', value: 1268, color: 'var(--color-primary-500)', icon: User },
  { label: '系统日志', value: 5632, color: 'var(--color-success-500)', icon: Document },
  { label: '在线用户', value: 42, color: 'var(--color-warning-500)', icon: Connection },
  { label: '系统运行', value: 365, color: 'var(--color-info-500)', icon: Clock },
]

// 快捷入口
const quickLinks = [
  { label: '用户管理', path: '/account/user', color: 'var(--color-primary-500)', icon: User },
  { label: '操作日志', path: '/system/log/operation', color: 'var(--color-success-500)', icon: Document },
  { label: '字典管理', path: '/system/dict', color: 'var(--color-warning-500)', icon: List },
  { label: '角色管理', path: '/account/role', color: 'var(--color-info-500)', icon: Setting },
]

function handleNavigate(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="dashboard-container">
    <!-- 欢迎区域 -->
    <el-card class="welcome-card" shadow="hover">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">
            欢迎回来，{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '管理员' }}！
          </h1>
          <p class="welcome-subtitle">
            今天是 {{ currentDate }}，祝您工作愉快
          </p>
        </div>
        <div class="welcome-icon">
          <el-icon :size="64" color="var(--color-primary-500)">
            <Monitor />
          </el-icon>
        </div>
      </div>
    </el-card>

    <!-- 数据统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col v-for="stat in statsData" :key="stat.label" :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="28" color="#fff">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <el-statistic :value="stat.value" :title="stat.label" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>快捷入口</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col v-for="link in quickLinks" :key="link.label" :xs="12" :sm="8" :md="6">
          <div class="quick-link" @click="handleNavigate(link.path)">
            <el-icon :size="24" :color="link.color">
              <component :is="link.icon" />
            </el-icon>
            <span class="quick-link-label">{{ link.label }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 系统信息 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>系统信息</span>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统名称">
          SnowGo 管理平台
        </el-descriptions-item>
        <el-descriptions-item label="当前版本">
          v1.0.0
        </el-descriptions-item>
        <el-descriptions-item label="登录账号">
          {{ userStore.userInfo?.username || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="登录时间">
          {{ currentTime }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.dashboard-container {
  padding: var(--space-6);
}

.welcome-card {
  margin-bottom: 20px;

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.welcome-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.welcome-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--text-tertiary);
}

.welcome-icon {
  opacity: 0.15;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 16px;
  }
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
}

.stat-info {
  flex: 1;

  :deep(.el-statistic__head) {
    font-size: 13px;
    color: var(--text-tertiary);
    margin-bottom: 4px;
  }

  :deep(.el-statistic__content) {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.section-card {
  margin-bottom: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s;
  background-color: var(--color-gray-100);
  margin-bottom: 12px;

  &:hover {
    background-color: var(--color-primary-50);
    transform: translateY(-2px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}

.quick-link-label {
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
