import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/store/user'

/**
 * v-permission 指令：根据权限标识控制元素显示/隐藏
 * 用法：
 *   v-permission="'account:user:create'"        // 单个权限
 *   v-permission="['account:user:create', 'account:user:update']"  // 任一权限
 */
export const vPermission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const userStore = useUserStore()
    const perms = Array.isArray(binding.value) ? binding.value : [binding.value]

    const hasPerm = perms.some(p => userStore.permissions.includes(p))
    if (!hasPerm) {
      el.parentNode?.removeChild(el)
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const userStore = useUserStore()
    const perms = Array.isArray(binding.value) ? binding.value : [binding.value]

    const hasPerm = perms.some(p => userStore.permissions.includes(p))
    if (!hasPerm && el.parentNode) {
      el.parentNode.removeChild(el)
    }
  },
}
