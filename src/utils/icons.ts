import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Font Awesome → Element Plus 图标映射（兼容旧数据）
const FA_TO_EP_ICON: Record<string, string> = {
  'fa fa-user-o': 'User',
  'fa fa-user': 'User',
  'fa fa-user-secret': 'Key',
  'fa fa-th-list': 'Menu',
  'fa fa-pencil-square-o': 'Document',
  'fa fa-sign-in': 'Monitor',
  'fa fa-bookmark-o': 'Collection',
  'fa fa-cog': 'Setting',
  'fa fa-home': 'HomeFilled',
  'fa fa-dashboard': 'Odometer',
}

/**
 * 从图标名称字符串获取 Element Plus 图标组件
 * 支持两种格式：
 * - Element Plus 图标名：'User', 'Setting' 等
 * - Font Awesome class：'fa fa-user-o', 'fa fa-home' 等
 */
export function getIconComponent(name?: string) {
  if (!name)
    return undefined

  // 1. 尝试 Font Awesome 映射
  const mapped = FA_TO_EP_ICON[name]
  if (mapped) {
    return (ElementPlusIconsVue as Record<string, unknown>)[mapped]
  }

  // 2. 直接按 Element Plus 图标名查找
  return (ElementPlusIconsVue as Record<string, unknown>)[name] as unknown
}
