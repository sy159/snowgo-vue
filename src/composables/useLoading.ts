import { ref } from 'vue'

/**
 * 通用加载状态管理
 */
export function useLoading(initialState = false) {
  const loading = ref(initialState)

  function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    loading.value = true
    return fn().finally(() => {
      loading.value = false
    })
  }

  return { loading, withLoading }
}
