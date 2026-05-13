import type { RouteLocationNormalized } from 'vue-router'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getStorageItem, setStorageItem } from '@/utils/storage'

const TABS_KEY = 'visited_tabs'
const MAX_TABS = 5

export interface TabItem {
  name: string
  path: string
  title: string
  closable: boolean
}

export const useTabsStore = defineStore('tabs', () => {
  const visitedTabs = ref<TabItem[]>((getStorageItem<TabItem[]>(TABS_KEY) || []).slice(-MAX_TABS))
  const activeTabPath = ref<string>('')

  const tabPaths = computed(() => visitedTabs.value.map(tab => tab.path))

  // 添加 Tab
  function addTab(route: RouteLocationNormalized): void {
    if (!route.name || !route.meta?.title)
      return

    const path = route.path
    const index = tabPaths.value.indexOf(path)
    if (index !== -1) {
      // 已存在：移到末尾
      const [tab] = visitedTabs.value.splice(index, 1)
      visitedTabs.value.push(tab)
      activeTabPath.value = path
      saveTabs()
      return
    }

    const tab: TabItem = {
      name: route.name as string,
      path,
      title: route.meta.title as string,
      closable: path !== '/dashboard',
    }
    visitedTabs.value.push(tab)
    // 超过最大数量，移除最前面的
    if (visitedTabs.value.length > MAX_TABS) {
      visitedTabs.value.shift()
    }
    activeTabPath.value = path
    saveTabs()
  }

  // 移除 Tab
  function removeTab(path: string, routerPush: (path: string) => void): void {
    const index = visitedTabs.value.findIndex(tab => tab.path === path)
    if (index === -1)
      return

    visitedTabs.value.splice(index, 1)
    saveTabs()

    // 如果关闭的是当前激活的 Tab，激活前一个
    if (activeTabPath.value === path && visitedTabs.value.length > 0) {
      const nextTab = visitedTabs.value[Math.max(0, index - 1)]
      activeTabPath.value = nextTab.path
      routerPush(nextTab.path)
    }
  }

  // 关闭其他 Tab
  function closeOtherTabs(path: string): void {
    visitedTabs.value = visitedTabs.value.filter(
      tab => tab.path === path || tab.path === '/dashboard',
    )
    saveTabs()
  }

  // 关闭右侧 Tab
  function closeRightTabs(path: string): void {
    const index = visitedTabs.value.findIndex(tab => tab.path === path)
    if (index === -1)
      return
    visitedTabs.value = visitedTabs.value.slice(0, index + 1)
    saveTabs()
  }

  // 持久化
  function saveTabs(): void {
    setStorageItem(TABS_KEY, visitedTabs.value)
  }

  // 清空所有 Tab
  function clearTabs(): void {
    visitedTabs.value = []
    activeTabPath.value = ''
    setStorageItem(TABS_KEY, [])
  }

  return {
    visitedTabs,
    activeTabPath,
    addTab,
    removeTab,
    closeOtherTabs,
    closeRightTabs,
    clearTabs,
  }
})
