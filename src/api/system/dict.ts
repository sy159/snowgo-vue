import { http } from '@/utils/request'

// 字典信息
export interface DictInfo {
  id: number
  code: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

// 字典项信息
export interface ItemInfo {
  id: number
  item_name: string
  item_code: string
  status: string
  sort_order: number
  description: string
  created_at: string
  updated_at: string
}

// 字典列表
export interface DictList {
  list: DictInfo[]
  total: number
}

// 字典列表查询条件
export interface DictListCondition {
  name?: string
  code?: string
  offset: number
  limit: number
}

// 创建/更新字典参数
export interface DictParam {
  id?: number
  code: string
  name: string
  description?: string
}

// 创建/更新字典项参数
export interface DictItemParam {
  id?: number
  dict_id: number
  dict_code: string
  item_name: string
  item_code: string
  status: string
  sort_order?: number
  description?: string
}

// 获取字典列表
export function getDictList(params: DictListCondition) {
  return http.get<DictList>('/api/admin/system/dict', { params })
}

// 创建字典
export function createDict(data: DictParam) {
  return http.post<number>('/api/admin/system/dict', data)
}

// 更新字典
export function updateDict(data: DictParam) {
  return http.put<number>('/api/admin/system/dict', data)
}

// 删除字典
export function deleteDictById(id: number) {
  return http.delete(`/api/admin/system/dict/${id}`)
}

// 根据字典编码获取字典项列表
export function getItemListByDictCode(code: string) {
  return http.get<ItemInfo[]>(`/api/admin/system/dict/item/${code}`)
}

// 创建字典项
export function createItem(data: DictItemParam) {
  return http.post<number>('/api/admin/system/dict/item', data)
}

// 更新字典项
export function updateDictItem(data: DictItemParam) {
  return http.put<number>('/api/admin/system/dict/item', data)
}

// 删除字典项
export function deleteDictItem(id: number) {
  return http.delete(`/api/admin/system/dict/item/${id}`)
}
