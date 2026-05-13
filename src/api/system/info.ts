import { http } from '@/utils/request'

export interface ServiceInfo {
  name: string
  version: string
  env: string
  start_time: string
  uptime: string
  read_timeout: string
  write_timeout: string
}

export interface GoRuntime {
  go_version: string
  goroutines: number
  mem_alloc_mb: number
  mem_total_mb: number
  mem_sys_mb: number
  gc_count: number
  num_cpu: number
}

export interface OSInfo {
  os: string
  arch: string
  hostname: string
  disk_total_gb: number
  disk_used_gb: number
  disk_free_gb: number
}

export interface SystemInfo {
  service_info: ServiceInfo
  go_runtime: GoRuntime
  os_info: OSInfo
}

export function getSystemInfo() {
  return http.get<SystemInfo>('/api/admin/system/info')
}
