<script setup lang="ts">
import type { SystemInfo } from '@/api/system/info'
import {
  Calendar,
  CollectionTag,
  Cpu,
  DataBoard,
  Files,
  Platform,
  Refresh,
  Stopwatch,
  Timer,
} from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getSystemInfo } from '@/api/system/info'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const systemInfo = ref<SystemInfo | null>(null)
const loading = ref(false)
const now = ref(new Date())
let sysTimer: ReturnType<typeof setInterval> | null = null

const quotes = [
  '不积跬步，无以至千里；不积小流，无以成江海。',
  '路漫漫其修远兮，吾将上下而求索。',
  '宝剑锋从磨砺出，梅花香自苦寒来。',
  '长风破浪会有时，直挂云帆济沧海。',
  '千里之行，始于足下。',
  '志当存高远。',
  '天行健，君子以自强不息。',
  '业精于勤，荒于嬉；行成于思，毁于随。',
  '非淡泊无以明志，非宁静无以致远。',
  '博观而约取，厚积而薄发。',
  '世上无难事，只要肯登攀。',
  '星光不问赶路人，时光不负有心人。',
  '每一个优秀的人，都有一段沉默的时光。',
  '不忘初心，方得始终。',
  '心之所向，素履以往；生如逆旅，一苇以航。',
  '你若盛开，蝴蝶自来。',
  '越努力，越幸运。',
  '高山仰止，景行行止。',
  '滴水穿石，非一日之功。',
  '人生在勤，不索何获。',
]

const quote = ref(quotes[Math.floor(Math.random() * quotes.length)])

function randomQuote() {
  quote.value = quotes[Math.floor(Math.random() * quotes.length)]
}

const currentDate = computed(() => {
  const w = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.value.getDay()]
  return `${now.value.getFullYear()}年${now.value.getMonth() + 1}月${now.value.getDate()}日 ${w}`
})

const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 6)
    return '夜深了'
  if (h < 9)
    return '早上好'
  if (h < 12)
    return '上午好'
  if (h < 14)
    return '中午好'
  if (h < 18)
    return '下午好'
  return '晚上好'
})

const envTagType = computed(() => {
  const env = systemInfo.value?.service_info.env || ''
  if (env === 'prod')
    return 'danger'
  if (env === 'uat')
    return 'warning'
  return 'success'
})

const diskPercent = computed(() => {
  if (!systemInfo.value)
    return 0
  const { disk_used_gb, disk_total_gb } = systemInfo.value.os_info
  return disk_total_gb ? Math.round((disk_used_gb / disk_total_gb) * 100) : 0
})

const diskColor = computed(() => {
  if (diskPercent.value >= 90)
    return '#ef4444'
  if (diskPercent.value >= 70)
    return '#f59e0b'
  return '#6366f1'
})

const memPercent = computed(() => {
  if (!systemInfo.value)
    return 0
  const { mem_alloc_mb, mem_sys_mb } = systemInfo.value.go_runtime
  return mem_sys_mb ? Math.round((mem_alloc_mb / mem_sys_mb) * 100) : 0
})

const memColor = computed(() => {
  if (memPercent.value >= 90)
    return '#ef4444'
  if (memPercent.value >= 70)
    return '#f59e0b'
  return '#10b981'
})

async function fetchSystemInfo() {
  loading.value = true
  try {
    const res = await getSystemInfo()
    systemInfo.value = res.data
    randomQuote()
  }
  catch (err) {
    console.error('[dashboard] fetchSystemInfo failed:', err)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSystemInfo()
  sysTimer = setInterval(fetchSystemInfo, 30000)
})

onUnmounted(() => {
  if (sysTimer)
    clearInterval(sysTimer)
})
</script>

<template>
  <div class="dashboard">
    <!-- ==================== 欢迎区 ==================== -->
    <section class="hero">
      <div class="hero-left">
        <div class="hero-avatar" aria-hidden="true">
          {{ (userStore.userInfo?.nickname || userStore.userInfo?.username || '管')[0] }}
        </div>
        <div class="hero-text">
          <h1 class="hero-greeting">
            {{ greeting }}，<strong>{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '管理员' }}</strong>
          </h1>
          <div class="hero-meta">
            <span class="hero-date"><el-icon :size="14"><Calendar /></el-icon> {{ currentDate }}</span>
          </div>
        </div>
      </div>
      <div class="hero-status">
        <div class="status-card status-env">
          <span class="status-icon"><el-icon><DataBoard /></el-icon></span>
          <div>
            <span class="status-label">环境</span>
            <strong>{{ systemInfo?.service_info.env?.toUpperCase() || '-' }}</strong>
          </div>
        </div>
        <div class="status-card status-version">
          <span class="status-icon"><el-icon><CollectionTag /></el-icon></span>
          <div>
            <span class="status-label">版本</span>
            <strong>{{ systemInfo?.service_info.version || '-' }}</strong>
          </div>
        </div>
        <div class="status-card status-uptime">
          <span class="status-icon"><el-icon><Stopwatch /></el-icon></span>
          <div>
            <span class="status-label">运行时长</span>
            <strong>{{ systemInfo?.service_info.uptime || '-' }}</strong>
          </div>
        </div>
      </div>
      <div class="hero-actions">
        <span class="hero-quote">{{ quote }}</span>
        <el-button class="hero-refresh" :icon="Refresh" circle :loading="loading" size="small" @click="fetchSystemInfo" />
      </div>
    </section>

    <!-- ==================== 服务信息 + 资源占用 ==================== -->
    <el-row :gutter="20" class="card-row">
      <!-- 服务信息 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="dash-card card-accent-blue">
          <template #header>
            <div class="card-header">
              <el-icon :size="18">
                <Platform />
              </el-icon>
              <span>服务信息</span>
              <span v-if="systemInfo" class="status-dot" />
              <el-tag v-if="systemInfo" :type="envTagType" size="small" effect="plain" round class="ml-auto">
                {{ systemInfo.service_info.env.toUpperCase() }}
              </el-tag>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="服务名称">
              {{ systemInfo?.service_info.name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="版本号">
              {{ systemInfo?.service_info.version || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="运行时长">
              <span class="highlight">{{ systemInfo?.service_info.uptime || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="启动时间">
              {{ systemInfo?.service_info.start_time || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="操作系统">
              {{ systemInfo?.os_info.os || '-' }} / {{ systemInfo?.os_info.arch || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="主机名">
              {{ systemInfo?.os_info.hostname || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="超时配置">
              读 {{ systemInfo?.service_info.read_timeout || '-' }} / 写 {{ systemInfo?.service_info.write_timeout || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 资源占用 -->
      <el-col :xs="24" :lg="10">
        <el-card v-if="systemInfo" shadow="never" class="dash-card card-accent-purple">
          <template #header>
            <div class="card-header">
              <el-icon :size="18">
                <Cpu />
              </el-icon>
              <span>资源占用</span>
              <span class="card-badge">Go {{ systemInfo.go_runtime.go_version }}</span>
            </div>
          </template>
          <div class="res-list">
            <!-- CPU -->
            <div class="res-row">
              <div class="res-badge cpu">
                <el-icon :size="18">
                  <Cpu />
                </el-icon>
              </div>
              <div class="res-body">
                <span class="res-label">CPU</span>
                <span class="res-desc">{{ systemInfo.go_runtime.num_cpu }} 核心 · Goroutines {{ systemInfo.go_runtime.goroutines }}</span>
              </div>
              <span class="res-value">{{ systemInfo.go_runtime.num_cpu }}<small> 核</small></span>
            </div>
            <!-- 内存 -->
            <div class="res-row">
              <div class="res-badge mem">
                <el-icon :size="18">
                  <Timer />
                </el-icon>
              </div>
              <div class="res-body">
                <div class="res-head">
                  <span class="res-label">内存</span>
                  <span class="res-pct" :style="{ color: memColor }">{{ memPercent }}%</span>
                </div>
                <div class="res-bar">
                  <div class="res-bar-fill" :style="`width: ${memPercent}%; background: ${memColor}`" />
                </div>
              </div>
              <span class="res-value">{{ systemInfo.go_runtime.mem_alloc_mb }}<small> MB</small></span>
            </div>
            <!-- 磁盘 -->
            <div class="res-row">
              <div class="res-badge disk">
                <el-icon :size="18">
                  <Files />
                </el-icon>
              </div>
              <div class="res-body">
                <div class="res-head">
                  <span class="res-label">磁盘</span>
                  <span class="res-pct" :style="{ color: diskColor }">{{ diskPercent }}%</span>
                </div>
                <div class="res-bar">
                  <div class="res-bar-fill" :style="`width: ${diskPercent}%; background: ${diskColor}`" />
                </div>
              </div>
              <span class="res-value">{{ systemInfo.os_info.disk_used_gb }}<small> GB</small></span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ==================== Go Runtime ==================== -->
    <el-card v-if="systemInfo" shadow="never" class="dash-card card-accent-orange section-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="18">
            <Platform />
          </el-icon>
          <span>Go Runtime</span>
        </div>
      </template>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="Go Version">
          {{ systemInfo.go_runtime.go_version }}
        </el-descriptions-item>
        <el-descriptions-item label="Goroutines">
          <span class="highlight">{{ systemInfo.go_runtime.goroutines }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="GC 次数">
          {{ systemInfo.go_runtime.gc_count }}
        </el-descriptions-item>
        <el-descriptions-item label="Num CPU">
          {{ systemInfo.go_runtime.num_cpu }}
        </el-descriptions-item>
        <el-descriptions-item label="Mem Alloc">
          {{ systemInfo.go_runtime.mem_alloc_mb }} MB
        </el-descriptions-item>
        <el-descriptions-item label="Mem Total">
          {{ systemInfo.go_runtime.mem_total_mb }} MB
        </el-descriptions-item>
        <el-descriptions-item label="Mem Sys">
          {{ systemInfo.go_runtime.mem_sys_mb }} MB
        </el-descriptions-item>
        <el-descriptions-item label="磁盘总量">
          <span class="highlight">{{ systemInfo.os_info.disk_free_gb }} GB</span> / {{ systemInfo.os_info.disk_total_gb }} GB
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
/* ===== 容器 ===== */
.dashboard {
  padding: var(--space-5);
  background: var(--bg-page);
  min-height: 100%;
}

.card-row {
  margin-bottom: var(--space-5);
}

/* ===== 卡片基类 ===== */
.dash-card {
  height: 100%;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);

  :deep(.el-card__header) {
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-gray-100);
  }
  :deep(.el-card__body) {
    padding: var(--space-5);
  }
}

.section-card {
  // spacing provided by .card-row margin-bottom above
}

.card-accent-blue   { border-top: 3px solid #3b82f6; }
.card-accent-purple { border-top: 3px solid var(--color-primary-500); }
.card-accent-orange { border-top: 3px solid #f97316; }

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
}

.card-badge {
  margin-left: auto;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-primary-500);
  background: var(--color-primary-50);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
}

.highlight {
  color: var(--color-primary-600);
  font-weight: 600;
}

/* ===== Hero ===== */
.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(260px, 0.85fr) minmax(430px, 1.35fr) minmax(180px, 0.55fr);
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  background: var(--bg-surface);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.hero-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-width: 0;
}

.hero-avatar {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  background: var(--color-primary-600);
  color: #fff;
  font-size: var(--text-xl);
  font-weight: 700;
}

.hero-greeting {
  margin: 0 0 var(--space-1);
  font-size: var(--text-xl);
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;

  strong {
    font-weight: 700;
    color: var(--color-primary-700);
  }
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.hero-date,
.hero-clock {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: 500;
}

.hero-status {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  min-width: 0;
}

.status-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.status-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  color: var(--color-primary-600);
  background: var(--color-primary-50);
}

.status-card > div {
  min-width: 0;
}

.status-label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-gray-600);
}

.status-card strong {
  display: block;
  font-size: var(--text-base);
  color: var(--text-primary);
  font-family: var(--font-mono);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  min-width: 0;
}

.hero-quote {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  width: 180px;
  text-align: right;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.hero-refresh {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  min-height: 32px;
  padding: 0;
  border-radius: 50%;
}

/* ===== 资源占用 ===== */
.res-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.res-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-gray-50);
  }
}

.res-badge {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  color: #fff;

  &.cpu  { background: var(--color-primary-500); }
  &.mem  { background: #10b981; }
  &.disk { background: #6366f1; }
}

.res-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.res-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.res-label {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
}

.res-desc {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.res-pct {
  font-size: var(--text-sm);
  font-weight: 700;
  font-family: var(--font-mono);
}

.res-bar {
  height: 8px;
  border-radius: 4px;
  background: var(--color-gray-200);
  overflow: hidden;
}

.res-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width var(--transition-slow);
}

.res-value {
  flex-shrink: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-primary);
  text-align: right;

  small {
    font-size: var(--text-sm);
    font-weight: 400;
    color: var(--text-tertiary);
  }
}

/* ===== 状态指示灯 ===== */
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
  animation: status-pulse 2s ease-in-out infinite;
}

@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}

.ml-auto {
  margin-left: auto;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    align-items: flex-start;
    gap: var(--space-5);
    padding: var(--space-5);
  }
  .hero-status {
    grid-template-columns: 1fr;
    width: 100%;
  }
  .hero-actions {
    justify-content: space-between;
  }
  .hero-quote {
    text-align: left;
    max-width: 100%;
  }
}
</style>
