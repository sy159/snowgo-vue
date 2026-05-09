<script setup lang="ts">
import type { TabItem } from '@/store/tabs'
import { Expand, Fold, House, User } from '@element-plus/icons-vue'
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
      tabsStore.addTab(route, (path: string) => router.push(path))
      tabsStore.activeTabPath = route.path
    }
  },
  { immediate: true },
)

onMounted(async () => {
  // 加载菜单树
  await permissionStore.fetchMenuTree()

  document.addEventListener('click', handleOutsideClick)
  // 初始化第一个 Tab
  if (route.name && route.meta?.title) {
    tabsStore.addTab(route, (path: string) => router.push(path))
    tabsStore.activeTabPath = route.path
  }
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
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          :router="true"
        >
          <!-- 首页固定项 -->
          <el-menu-item index="/dashboard">
            <el-icon><House /></el-icon>
            <template #title>
              首页
            </template>
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
    <div v-if="contextMenuVisible" class="context-menu" :style="{ left: `${contextMenuX}px`, top: `${contextMenuY}px` }">
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
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.tabs-bar {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  gap: 4px;
  overflow-x: auto;
}

.tab-item {
  cursor: pointer;
  margin-right: 4px;
}

.main {
  background: #f0f2f5;
  padding: 20px;
}

.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  padding: 4px 0;
  min-width: 120px;
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
