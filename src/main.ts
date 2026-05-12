import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { vPermission } from './directives/permission'
import router from './router'

import './assets/styles/variables.css'
import './assets/styles/element-overrides.css'
import 'element-plus/dist/index.css'
import './assets/styles/layout.css'
import './assets/styles/components.css'
import './assets/styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.directive('permission', vPermission)
app.mount('#app')
