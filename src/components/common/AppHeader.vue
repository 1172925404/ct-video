<template>
  <header class="app-header">
    <div class="header-container">
      <!-- 左侧：Logo + 导航菜单 -->
      <div class="header-left">
        <div class="logo" @click="goHome">
          <span class="logo-icon">▶</span>
          <span class="logo-text">CT视频</span>
        </div>
        <nav class="nav-menu">
          <router-link to="/" class="nav-item" active-class="active">首页</router-link>
          <router-link to="/video" class="nav-item" active-class="active">视频</router-link>
          <router-link to="/chat" class="nav-item" active-class="active">聊天社区</router-link>
        </nav>
      </div>

      <!-- 中间：搜索框（修改） -->
      <div class="header-center">
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索视频、UP主..."
          size="medium"
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <n-button size="small" type="primary" @click="handleSearch">
              <template #icon>
                <n-icon><SearchOutline /></n-icon>
              </template>
            </n-button>
          </template>
        </n-input>
      </div>

      <!-- 右侧：用户操作（保持不变） -->
      <div class="header-right">
        <div v-if="userStore.getIsLoggedIn" class="user-section">
          <!-- 👇 新增：上传按钮 + Tooltip -->
          <n-tooltip placement="bottom">
            <template #trigger>
              <n-button quaternary circle @click="goToUpload">
                <n-icon size="20"><CloudUploadOutline /></n-icon>
              </n-button>
            </template>
            上传视频
          </n-tooltip>

          <!-- 👇 新增：私信按钮，添加红点 + Tooltip -->
          <n-tooltip placement="bottom">
            <template #trigger>
              <n-button quaternary circle @click="goToConversations" class="notification-btn">
                <n-icon size="20"><ChatbubbleEllipsesOutline /></n-icon>
                <span v-if="conversationStore.hasUnread" class="notification-dot"></span>
              </n-button>
            </template>
            私信
          </n-tooltip>

          <!-- 👇 修改：通知按钮，添加红点 + Tooltip -->
          <n-tooltip placement="bottom">
            <template #trigger>
              <n-button quaternary circle @click="goToNotifications" class="notification-btn">
                <n-icon size="20"><NotificationsOutline /></n-icon>
                <span v-if="notificationStore.hasUnread" class="notification-dot"></span>
              </n-button>
            </template>
            消息通知
          </n-tooltip>

          <!-- 👇 收藏按钮 + Tooltip -->
          <n-tooltip placement="bottom">
            <template #trigger>
              <n-button quaternary circle @click="handleFavorites">
                <n-icon size="20"><HeartOutline /></n-icon>
              </n-button>
            </template>
            我的收藏
          </n-tooltip>

          <!-- 👇 历史按钮 + Tooltip -->
          <n-tooltip placement="bottom">
            <template #trigger>
              <n-button quaternary circle @click="handleHistory">
                <n-icon size="20"><TimeOutline /></n-icon>
              </n-button>
            </template>
            观看历史
          </n-tooltip>

          <n-dropdown
            trigger="hover"
            :options="dropdownOptions"
            @select="handleDropdownSelect"
          >
            <div class="user-avatar">
              <n-avatar :size="32" :src="userStore.getUserAvatar" />
            </div>
          </n-dropdown>
        </div>
        
        <div v-else class="login-section">
          <n-button text @click="showLoginModal = true">登录</n-button>
          <n-button type="primary" @click="showLoginModal = true">注册</n-button>
        </div>
      </div>
    </div>

    <!-- 登录注册模态框 -->
    <LoginModal
      v-model:show="showLoginModal"
      @success="onLoginSuccess"
    />
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NInput,
  NButton,
  NIcon,
  NAvatar,
  NDropdown,
  NTooltip  // 👈 新增：导入 NTooltip
} from 'naive-ui'
import {
  SearchOutline,
  NotificationsOutline,
  HeartOutline,
  TimeOutline,
  CloudUploadOutline,  // 👈 新增：上传图标
  ChatbubbleEllipsesOutline  // 👈 新增：私信图标
} from '@vicons/ionicons5'
import LoginModal from '@/components/user/LoginModal.vue'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'  // 👈 新增：通知 Store
import { useConversationStore } from '@/stores/conversation'  // 👈 新增：私信 Store

const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()  // 👈 新增
const conversationStore = useConversationStore()  // 👈 新增

const searchKeyword = ref('')
const showLoginModal = ref(false)

// 下拉菜单选项
const dropdownOptions = [
  {
    label: '个人中心',
    key: 'profile'
  },
  {
    label: '我的收藏',
    key: 'favorites'
  },
  {
    label: '观看历史',
    key: 'history'
  },
  {
    type: 'divider',
    key: 'divider1'
  },
  {
    label: '退出登录',
    key: 'logout'
  }
]

// 方法
const goHome = () => {
  router.push('/')
}

// 👇 新增：跳转到上传页面
const goToUpload = () => {
  router.push('/upload')
}

// 👇 新增：跳转到私信页面
const goToConversations = () => {
  router.push('/conversations')
}

// 👇 新增：跳转到通知页面
const goToNotifications = () => {
  router.push('/notifications')
}

// 搜索方法（修改）
const handleSearch = () => {
  const keyword = searchKeyword.value.trim()
  if (keyword) {
    // 跳转到搜索页面，把关键词作为 URL 参数传递
    router.push({
      path: '/search',
      query: { q: keyword }
    })
  }
}

const handleMessages = () => {
  console.log('打开消息')
}

const handleFavorites = () => {
  router.push('/favorites')
}

const handleHistory = () => {
  router.push('/history')
}

const handleDropdownSelect = (key) => {
  if (key === 'logout') {
    userStore.logout()
    notificationStore.reset()  // 👈 登出时重置通知状态
    conversationStore.reset()  // 👈 登出时重置私信状态
  } else if (key === 'profile') {
    router.push('/user/' + (userStore.user?.id || 'me'))
  } else if (key === 'favorites') {
    router.push('/favorites')
  } else if (key === 'history') {
    router.push('/history')
  }
}

const onLoginSuccess = (user) => {
  console.log('登录成功', user)
  // 👇 登录后获取未读通知数量
  notificationStore.fetchUnreadCount()
  // 👇 登录后获取未读私信数量
  conversationStore.fetchUnreadCount()
}

// 👇 新增：定时获取未读通知数量和私信数量（轮询）
let pollInterval = null

onMounted(() => {
  if (userStore.getIsLoggedIn) {
    notificationStore.fetchUnreadCount()
    conversationStore.fetchUnreadCount()
  }
  // 每30秒刷新一次未读数量
  pollInterval = setInterval(() => {
    if (userStore.getIsLoggedIn) {
      notificationStore.fetchUnreadCount()
      conversationStore.fetchUnreadCount()
    }
  }, 30000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(251, 114, 153, 0.12);
  z-index: 1000;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 20px rgba(251, 114, 153, 0.06);
}

.header-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

/* ===== 左侧 ===== */
.header-left {
  display: flex;
  align-items: center;
  gap: 30px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
  color: #212121;
}

.logo-icon {
  background: linear-gradient(135deg, #fb7299, #ff8aab);
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(251, 114, 153, 0.3);
}

.logo-text {
  background: linear-gradient(135deg, #fb7299, #ff6b8a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  display: flex;
  gap: 20px;
}

.nav-item {
  font-size: 15px;
  color: #666;
  padding: 4px 0;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  position: relative;
}

.nav-item:hover {
  color: #212121;
}

.nav-item.active {
  color: #fb7299;
  border-bottom-color: #fb7299;
}

/* ===== 中间搜索 ===== */
.header-center {
  flex: 1;
  max-width: 500px;
  margin: 0 30px;
}

.header-center :deep(.n-input) {
  border-radius: 20px !important;
  border-color: rgba(251, 114, 153, 0.15) !important;
  transition: all 0.3s !important;
}

.header-center :deep(.n-input:hover) {
  border-color: rgba(251, 114, 153, 0.3) !important;
}

.header-center :deep(.n-input:focus-within) {
  border-color: #fb7299 !important;
  box-shadow: 0 0 0 4px rgba(251, 114, 153, 0.1) !important;
}

.header-center :deep(.n-button) {
  background: linear-gradient(135deg, #fb7299, #ff8aab) !important;
  border-color: transparent !important;
  border-radius: 20px !important;
}

.header-center :deep(.n-button:hover) {
  box-shadow: 0 4px 16px rgba(251, 114, 153, 0.3) !important;
}

/* ===== 右侧 ===== */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-section :deep(.n-button) {
  color: #666 !important;
}

.user-section :deep(.n-button:hover) {
  color: #fb7299 !important;
}

/* 👇 新增：通知按钮红点 */
.notification-btn {
  position: relative;
}

.notification-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: #fb7299;
  border-radius: 50%;
  border: 2px solid #fff;
}

.user-avatar {
  cursor: pointer;
  transition: transform 0.3s;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.login-section {
  display: flex;
  gap: 12px;
}

.login-section :deep(.n-button--text) {
  color: #666 !important;
}

.login-section :deep(.n-button--text:hover) {
  color: #fb7299 !important;
}

.login-section :deep(.n-button--primary) {
  background: linear-gradient(135deg, #fb7299, #ff8aab) !important;
  border-color: transparent !important;
  border-radius: 20px !important;
}

.login-section :deep(.n-button--primary:hover) {
  box-shadow: 0 4px 16px rgba(251, 114, 153, 0.3) !important;
  transform: translateY(-1px);
}

/* ===== 下拉菜单 ===== */
.user-section :deep(.n-dropdown-menu) {
  border-radius: 12px !important;
  border: 1px solid rgba(251, 114, 153, 0.08) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08) !important;
  overflow: hidden !important;
}

.user-section :deep(.n-dropdown-option:hover) {
  background: rgba(251, 114, 153, 0.06) !important;
  color: #fb7299 !important;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .header-center {
    display: none;
  }
  .nav-menu {
    gap: 12px;
  }
  .nav-item {
    font-size: 13px;
  }
  .header-container {
    padding: 0 12px;
  }
  .logo-text {
    display: none;
  }
}
</style>
