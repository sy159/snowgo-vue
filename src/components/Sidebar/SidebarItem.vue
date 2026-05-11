<script setup lang="ts">
import type { MenuInfo } from '@/api/account/menu'
import { getIconComponent } from '@/utils/icons'

defineOptions({ name: 'SidebarItem' })

defineProps<{
  menus: MenuInfo[]
}>()

function getIcon(name?: string) {
  return getIconComponent(name)
}
</script>

<template>
  <template v-for="menu in menus" :key="menu.id">
    <!-- 目录：递归子菜单 -->
    <el-sub-menu v-if="menu.menu_type === 'Dir'" :index="menu.path || `dir-${menu.id}`">
      <template #title>
        <el-icon v-if="getIcon(menu.icon)">
          <component :is="getIcon(menu.icon)" />
        </el-icon>
        <span>{{ menu.name }}</span>
      </template>
      <SidebarItem v-if="menu.children?.length" :menus="menu.children" />
    </el-sub-menu>

    <!-- 菜单：可点击的菜单项，由 el-menu 的 router 模式处理导航 -->
    <el-menu-item v-else-if="menu.menu_type === 'Menu' && menu.path" :index="menu.path">
      <el-icon v-if="getIcon(menu.icon)">
        <component :is="getIcon(menu.icon)" />
      </el-icon>
      <template #title>
        {{ menu.name }}
      </template>
    </el-menu-item>
  </template>
</template>
