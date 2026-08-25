import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'

import App from './App.vue'
import router from './router'
import './assets/styles/global.css'

// 导入用户 Store（用于恢复登录状态）
import { useUserStore } from './stores/user'

const app = createApp(App)

// 创建 Pinia 实例
const pinia = createPinia()
app.use(pinia)

// ✅ 恢复登录状态（要在 pinia 注册之后）
const userStore = useUserStore()
userStore.restoreLoginState()

// 配置 Naive UI 主题（粉色）
app.use(naive, {
    themeOverrides: {
      common: {
        primaryColor: '#fb7299',
        primaryColorHover: '#ff8aab',
        primaryColorPressed: '#e85a7a',
        primaryColorSuppl: '#fce8ee'
      }
    }
  })

app.use(router)
app.use(naive)

app.mount('#app')