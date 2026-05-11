/** 用户状态 */
export const USER_STATUS = {
  ACTIVE: 1,
  DISABLED: 2,
} as const

/** 菜单类型 */
export const MENU_TYPE = {
  DIR: 'Dir',
  MENU: 'Menu',
  BTN: 'Btn',
} as const

/** 字典项状态 */
export const DICT_ITEM_STATUS = {
  ACTIVE: 'Active',
  DISABLED: 'Disabled',
} as const

/** 本地存储 key */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const
