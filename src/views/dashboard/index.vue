<script setup lang="ts">
import { Cpu, List, Monitor, Refresh, Setting } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import type { SystemInfo } from '@/api/system/info'
import { getSystemInfo } from '@/api/system/info'

const router = useRouter()
const userStore = useUserStore()

const systemInfo = ref<SystemInfo | null>(null)
const loading = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const currentDate = computed(() => {
  const now = new Date()
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
})

const diskPercent = computed(() => {
  if (!systemInfo.value) return 0
  const { disk_used_gb, disk_total_gb } = systemInfo.value.os_info
  if (!disk_total_gb) return 0
  return Math.round((disk_used_gb / disk_total_gb) * 100)
})

const diskStatusColor = computed(() => {
  if (diskPercent.value >= 90) return 'var(--color-danger-500)'
  if (diskPercent.value >= 70) return 'var(--color-warning-500)'
  return 'var(--color-success-500)'
})

const envTagType = computed(() => {
  const env = systemInfo.value?.service_info.env || ''
  if (env === 'prod') return 'danger'
  if (env === 'uat') return 'warning'
  return 'success'
})

async function fetchSystemInfo() {
  loading.value = true
  try {
    const res = await getSystemInfo()
    systemInfo.value = res.data
  }
  catch (err) {
    console.error('[dashboard] fetchSystemInfo failed:', err)
  }
  finally {
    loading.value = false
  }
}

function handleNavigate(path: string) {
  router.push(path)
}

const quickLinks = [
  { label: '用户管理', path: '/account/user', icon: Monitor },
  { label: '操作日志', path: '/system/log/operation', icon: Setting },
  { label: '字典管理', path: '/system/dict', icon: List },
  { label: '角色管理', path: '/account/role', icon: Setting },
]

onMounted(() => {
  fetchSystemInfo()
  timer = setInterval(fetchSystemInfo, 30000)
})

onUnmounted(() => {
  if (timer)
    clearInterval(timer)
})
</script>

<template>
  <div class="dashboard-container">
    <!-- 欢迎 + 快捷统计 -->
    <el-card shadow="hover" class="welcome-card card-accent-blue">
      <template #header>
        <div class="card-header-row">
          <div class="header-left">
            <h1 class="welcome-title">
              欢迎回来，{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '管理员' }}
            </h1>
            <p class="welcome-subtitle">
              {{ currentDate }}，祝您工作愉快
            </p>
          </div>
          <el-button :icon="Refresh" circle @click="fetchSystemInfo" :loading="loading" />
        </div>
      </template>
      <div v-if="systemInfo" class="quick-stats-row">
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-label">运行环境</span>
          <el-tag :type="envTagType" size="small" effect="dark">
            {{ systemInfo.service_info.env.toUpperCase() }}
          </el-tag>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-label">运行时长</span>
          <span class="stat-value">{{ systemInfo.service_info.uptime }}</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-label">Goroutines</span>
          <span class="stat-value">{{ systemInfo.go_runtime.goroutines }}</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-label">内存占用</span>
          <span class="stat-value">{{ systemInfo.go_runtime.mem_alloc_mb }} MB</span>
        </div>
      </div>
    </el-card>

    <!-- 服务器信息 + 磁盘 -->
    <el-row :gutter="20">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="section-card card-accent-orange">
          <template #header>
            <div class="card-header">
              <el-icon :size="18"><Setting /></el-icon>
              <span>服务器信息</span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="服务名称">
              {{ systemInfo?.service_info.name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="服务版本">
              {{ systemInfo?.service_info.version || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="操作系统">
              {{ systemInfo?.os_info.os || '-' }} / {{ systemInfo?.os_info.arch || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="主机名">
              {{ systemInfo?.os_info.hostname || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="启动时间">
              {{ systemInfo?.service_info.start_time || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="section-card card-accent-green">
          <template #header>
            <div class="card-header">
              <el-icon :size="18"><Monitor /></el-icon>
              <span>磁盘使用</span>
            </div>
          </template>
          <div class="disk-info">
            <div class="disk-visual">
              <el-progress
                type="dashboard"
                :percentage="diskPercent"
                :color="diskStatusColor"
                :stroke-width="12"
              />
            </div>
            <div class="disk-details">
              <div class="disk-row">
                <span class="disk-label">已使用</span>
                <span class="disk-value">{{ systemInfo?.os_info.disk_used_gb || 0 }} GB</span>
              </div>
              <div class="disk-row">
                <span class="disk-label">总容量</span>
                <span class="disk-value">{{ systemInfo?.os_info.disk_total_gb || 0 }} GB</span>
              </div>
              <div class="disk-row">
                <span class="disk-label">可用</span>
                <span class="disk-value">{{ systemInfo?.os_info.disk_free_gb || 0 }} GB</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Go Runtime -->
    <el-card v-if="systemInfo" shadow="hover" class="section-card card-accent-purple">
      <template #header>
        <div class="card-header">
          <el-icon :size="18"><Cpu /></el-icon>
          <span>Go Runtime</span>
        </div>
      </template>
      <div class="runtime-row">
        <div class="runtime-divider" />
        <div class="runtime-item">
          <span class="runtime-label">Go 版本</span>
          <span class="runtime-value">{{ systemInfo.go_runtime.go_version }}</span>
        </div>
        <div class="runtime-divider" />
        <div class="runtime-item">
          <span class="runtime-label">CPU 核心</span>
          <span class="runtime-value">{{ systemInfo.go_runtime.num_cpu }}</span>
        </div>
        <div class="runtime-divider" />
        <div class="runtime-item">
          <span class="runtime-label">Goroutines</span>
          <span class="runtime-value">{{ systemInfo.go_runtime.goroutines }}</span>
        </div>
        <div class="runtime-divider" />
        <div class="runtime-item">
          <span class="runtime-label">GC 次数</span>
          <span class="runtime-value">{{ systemInfo.go_runtime.gc_count }}</span>
        </div>
        <div class="runtime-divider" />
        <div class="runtime-item">
          <span class="runtime-label">已分配</span>
          <span class="runtime-value">{{ systemInfo.go_runtime.mem_alloc_mb }} MB</span>
        </div>
        <div class="runtime-divider" />
        <div class="runtime-item">
          <span class="runtime-label">总分配</span>
          <span class="runtime-value">{{ systemInfo.go_runtime.mem_total_mb }} MB</span>
        </div>
      </div>
    </el-card>

    <!-- 快捷入口 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="18"><List /></el-icon>
          <span>快捷入口</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col v-for="link in quickLinks" :key="link.label" :xs="12" :sm="8" :md="6">
          <div class="quick-link" @click="handleNavigate(link.path)">
            <el-icon :size="24">
              <component :is="link.icon" />
            </el-icon>
            <span class="quick-link-label">{{ link.label }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.dashboard-container {
  padding: var(--space-6);
  background: var(--bg-page);
  min-height: 100%;
}

/* ===== Welcome Card ===== */
.welcome-card {
  margin-bottom: var(--space-5);

  :deep(.el-card__body) {
    padding-top: var(--space-2);
  }
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-title {
  margin: 0 0 var(--space-1);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.welcome-subtitle {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

/* ===== Quick Stats Row ===== */
.quick-stats-row {
  display: flex;
  align-items: center;
  padding: var(--space-2) 0;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
}

.stat-divider {
  width: 1px;
  height: 32px;
  background-color: var(--color-gray-200);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.stat-value {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

/* ===== Section Cards ===== */
.section-card {
  margin-bottom: var(--space-5);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
}

/* ===== Disk ===== */
.disk-info {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-4) 0;
}

.disk-visual {
  flex-shrink: 0;
}

.disk-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1;
}

.disk-row {
  display: flex;
  justify-content: space-between;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-gray-100);
}

.disk-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.disk-value {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

/* ===== Go Runtime Row ===== */
.runtime-row {
  display: flex;
  align-items: center;
  padding: var(--space-1) 0;
}

.runtime-divider {
  width: 1px;
  height: 36px;
  background-color: var(--color-gray-200);
}

.runtime-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.runtime-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.runtime-value {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

/* ===== Quick Links ===== */
.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  background-color: var(--color-gray-100);
  margin-bottom: var(--space-3);
  color: var(--text-secondary);

  &:hover {
    background-color: var(--color-primary-50);
    color: var(--color-primary-500);
    transform: translateY(-2px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}

.quick-link-label {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
}
</style>
