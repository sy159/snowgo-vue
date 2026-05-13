<script setup lang="ts">
import type { TabItem } from '@/store/tabs'
import { Expand, Fold, House } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SidebarItem from '@/components/Sidebar/SidebarItem.vue'
import { usePermissionStore, useTabsStore, useUserStore } from '@/store'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const tabsStore = useTabsStore()
const permissionStore = usePermissionStore()

const isCollapse = ref(false)

const activeMenu = computed(() => route.path)

// 面包屑：根据菜单树查找父级
const breadcrumbs = computed(() => {
  const currentTitle = route.meta?.title as string
  if (!currentTitle) return []

  // 递归查找父级
  function findParent(items: any[], targetTitle: string, path: string[] = []): string[] | null {
    for (const item of items) {
      if (item.name === targetTitle) {
        return [...path, item.name]
      }
      if (item.children) {
        const found = findParent(item.children, targetTitle, [...path, item.name])
        if (found) return found
      }
    }
    return null
  }

  const result = findParent(permissionStore.menuTree, currentTitle)
  return result || [currentTitle]
})

const displayName = computed(() => {
  if (userStore.userInfo) {
    return userStore.userInfo.username || '用户'
  }
  return '用户'
})

const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuTab = ref<TabItem | null>(null)

function toggleCollapse(): void {
  isCollapse.value = !isCollapse.value
}

function handleCommand(command: string): void {
  if (command === 'logout') {
    userStore.logout()
  }
}

function handleTabClick(tab: TabItem): void {
  router.push(tab.path)
}

function handleTabClose(tab: TabItem): void {
  tabsStore.removeTab(tab.path, (path: string) => router.push(path))
}

function openTabContextMenu(event: MouseEvent, tab: TabItem): void {
  if (!tab.closable)
    return
  contextMenuVisible.value = true
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuTab.value = tab
}

function closeOtherTabs(): void {
  if (contextMenuTab.value) {
    tabsStore.closeOtherTabs(contextMenuTab.value.path)
  }
  contextMenuVisible.value = false
}

function closeRightTabs(): void {
  if (contextMenuTab.value) {
    tabsStore.closeRightTabs(contextMenuTab.value.path)
  }
  contextMenuVisible.value = false
}

function handleOutsideClick(): void {
  contextMenuVisible.value = false
}

// 路由变化时自动添加 Tab
watch(
  () => route.path,
  () => {
    if (route.name && route.meta?.title) {
      tabsStore.addTab(route)
      tabsStore.activeTabPath = route.path
    }
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div class="layout-container">
    <el-container class="layout">
      <!-- 侧边栏 -->
      <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
        <div class="logo">
          <span v-if="!isCollapse">SnowGo</span>
          <span v-else>SG</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :router="true"
        >
          <!-- 首页（管理台固定入口，不参与权限管理） -->
          <el-menu-item index="/dashboard">
            <el-icon><House /></el-icon>
            <template #title>首页</template>
          </el-menu-item>
          <!-- 动态菜单 -->
          <SidebarItem :menus="permissionStore.menuTree" />
        </el-menu>
      </el-aside>

      <el-container>
        <!-- 顶部 Header -->
        <el-header class="header">
          <div class="header-left">
            <el-icon class="collapse-btn" @click="toggleCollapse">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
            <div class="breadcrumb">
              <template v-for="(item, index) in breadcrumbs" :key="index">
                <span v-if="index > 0" class="breadcrumb-separator">/</span>
                <span
                  class="breadcrumb-item"
                  :class="{ 'breadcrumb-item-active': index === breadcrumbs.length - 1 }"
                >
                  {{ item }}
                </span>
              </template>
            </div>
          </div>
          <div class="header-center">
            <!-- Tab 页签 -->
            <div class="tabs-bar">
              <el-tag
                v-for="tab in tabsStore.visitedTabs"
                :key="tab.path"
                :closable="tab.closable"
                :effect="tabsStore.activeTabPath === tab.path ? 'dark' : 'light'"
                class="tab-item"
                @click="handleTabClick(tab)"
                @close="handleTabClose(tab)"
                @contextmenu.prevent="openTabContextMenu($event, tab)"
              >
                {{ tab.title }}
              </el-tag>
            </div>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <div class="user-avatar">{{ displayName.charAt(0).toUpperCase() }}</div>
                <span class="user-name">{{ displayName }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 内容区 -->
        <el-main class="main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>

    <!-- Tab 右键菜单 -->
    <div v-if="contextMenuVisible" class="context-menu" :style="{ left: `${contextMenuX}px`, top: `${contextMenuY}px` }" @click.stop>
      <div class="context-menu-item" @click="closeOtherTabs">
        关闭其他
      </div>
      <div class="context-menu-item" @click="closeRightTabs">
        关闭右侧
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout {
  height: 100%;
}

.sidebar {
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--color-gray-200);
  padding: 0 var(--space-6);
  height: 64px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  position: relative;
}

/* Top bar */
.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-gray-200);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
  min-width: 220px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.collapse-btn:hover {
  color: var(--color-primary-500);
  background-color: var(--color-primary-50);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.breadcrumb-separator {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.breadcrumb-item {
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.breadcrumb-item-active {
  color: var(--text-primary);
  font-weight: 600;
}

/* Tabs left-aligned in header */
.header-center {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  overflow: hidden;
  padding-left: var(--space-4);
}

.tabs-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.tab-item {
  cursor: pointer;
  border-radius: var(--radius-md) !important;
  border: 1px solid var(--color-gray-200) !important;
  padding: 0 var(--space-3) !important;
  height: 30px !important;
  line-height: 30px !important;
  font-size: var(--text-sm) !important;
  transition: all var(--transition-fast) !important;
  background: var(--bg-surface) !important;
  color: var(--text-secondary) !important;
}

.tab-item:hover {
  color: var(--color-primary-500) !important;
  border-color: var(--color-primary-300) !important;
  background: var(--color-primary-50) !important;
}

.tab-item.el-tag--dark {
  background: var(--color-primary-50) !important;
  color: var(--color-primary-600) !important;
  border-color: var(--color-primary-300) !important;
  font-weight: 500;
}

.tab-item.el-tag--dark:hover {
  background: var(--color-primary-100) !important;
}

.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: var(--space-4);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.user-info:hover {
  background-color: var(--color-gray-50);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: 600;
}

.user-name {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: 500;
}

.main {
  overflow-y: auto;
  background: var(--bg-page);
}

.context-menu {
  position: fixed;
  z-index: 9999;
}

.context-menu-item {
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  font-size: var(--text-sm);
}

.context-menu-item:hover {
  background: var(--color-gray-50);
}
</style>
