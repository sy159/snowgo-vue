import { ElAlert } from 'element-plus/es/components/alert/index.mjs'
import { ElButton } from 'element-plus/es/components/button/index.mjs'
import { ElCard } from 'element-plus/es/components/card/index.mjs'
import { ElCol } from 'element-plus/es/components/col/index.mjs'
import { ElConfigProvider } from 'element-plus/es/components/config-provider/index.mjs'
import { ElAside, ElContainer, ElHeader, ElMain } from 'element-plus/es/components/container/index.mjs'
import { ElDatePicker } from 'element-plus/es/components/date-picker/index.mjs'
import { ElDescriptions, ElDescriptionsItem } from 'element-plus/es/components/descriptions/index.mjs'
import { ElDialog } from 'element-plus/es/components/dialog/index.mjs'
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus/es/components/dropdown/index.mjs'
import { ElForm, ElFormItem } from 'element-plus/es/components/form/index.mjs'
import { ElIcon } from 'element-plus/es/components/icon/index.mjs'
import { ElInputNumber } from 'element-plus/es/components/input-number/index.mjs'
import { ElInput } from 'element-plus/es/components/input/index.mjs'
import { ElLink } from 'element-plus/es/components/link/index.mjs'
import { ElMenu, ElMenuItem, ElSubMenu } from 'element-plus/es/components/menu/index.mjs'
import { ElPagination } from 'element-plus/es/components/pagination/index.mjs'
import { ElRadio, ElRadioGroup } from 'element-plus/es/components/radio/index.mjs'
import { ElRow } from 'element-plus/es/components/row/index.mjs'
import { ElOption, ElSelect } from 'element-plus/es/components/select/index.mjs'
import { ElTable, ElTableColumn } from 'element-plus/es/components/table/index.mjs'
import { ElTag } from 'element-plus/es/components/tag/index.mjs'
import { ElTreeSelect } from 'element-plus/es/components/tree-select/index.mjs'
import { ElTree } from 'element-plus/es/components/tree/index.mjs'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { vPermission } from './directives/permission'
import router from './router'

import './assets/styles/variables.css'
import './assets/styles/element-overrides.css'
import 'element-plus/es/components/alert/style/css'
import 'element-plus/es/components/aside/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/col/style/css'
import 'element-plus/es/components/config-provider/style/css'
import 'element-plus/es/components/container/style/css'
import 'element-plus/es/components/date-picker/style/css'
import 'element-plus/es/components/descriptions/style/css'
import 'element-plus/es/components/descriptions-item/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/dropdown/style/css'
import 'element-plus/es/components/dropdown-item/style/css'
import 'element-plus/es/components/dropdown-menu/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/header/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/input-number/style/css'
import 'element-plus/es/components/link/style/css'
import 'element-plus/es/components/loading/style/css'
import 'element-plus/es/components/main/style/css'
import 'element-plus/es/components/menu/style/css'
import 'element-plus/es/components/menu-item/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/pagination/style/css'
import 'element-plus/es/components/radio/style/css'
import 'element-plus/es/components/radio-group/style/css'
import 'element-plus/es/components/row/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/sub-menu/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import 'element-plus/es/components/tag/style/css'
import 'element-plus/es/components/tree/style/css'
import 'element-plus/es/components/tree-select/style/css'
import './assets/styles/layout.css'
import './assets/styles/components.css'
import './assets/styles/global.css'

const elementComponents = [
  ElAlert,
  ElAside,
  ElButton,
  ElCard,
  ElCol,
  ElConfigProvider,
  ElContainer,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElForm,
  ElFormItem,
  ElHeader,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElLink,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElOption,
  ElPagination,
  ElRadio,
  ElRadioGroup,
  ElRow,
  ElSelect,
  ElSubMenu,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTree,
  ElTreeSelect,
]

const app = createApp(App)
app.use(createPinia())
app.use(router)
for (const component of elementComponents) {
  app.use(component)
}
app.directive('permission', vPermission)
app.mount('#app')
