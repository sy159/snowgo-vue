<script setup lang="ts">
import type { TabItem } from '@/store/tabs'
import type { RouteLocationMatched } from 'vue-router'
import { Expand, Fold, User } from '@element-plus/icons-vue'
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

  const crumbs: string[] = []

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
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-icon><User /></el-icon>
                {{ displayName }}
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
  height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.breadcrumb-separator {
  color: #9ca3af;
  margin: 0 2px;
}

.breadcrumb-item {
  color: #6b7280;
}

.breadcrumb-item-active {
  color: #111827;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.main {
  overflow-y: auto;
}

.context-menu {
  position: fixed;
  z-index: 9999;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.context-menu-item:hover {
  background: #f5f7fa;
}
</style>
