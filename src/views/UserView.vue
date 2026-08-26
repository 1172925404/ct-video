<template>
  <div class="user-container">
    <!-- 未登录状态 -->
    <div v-if="!userStore.getIsLoggedIn" class="not-logged-in">
      <div class="not-logged-in-icon">👤</div>
      <h2>请先登录</h2>
      <p>登录后可以查看个人中心、收藏视频、观看历史等</p>
      <n-button type="primary" @click="goToLogin">去登录</n-button>
    </div>

    <!-- 已登录状态 -->
    <div v-else class="user-content">
      <!-- 👇 判断是否为自己的主页 -->
      <div v-if="isOwnProfile">
        <!-- 自己的主页：完整个人中心 -->
        <!-- 用户信息卡片 -->
        <div class="user-profile-card">
          <div class="user-profile">
            <img :src="userStore.getUserAvatar" class="user-avatar-large" />
            <div class="user-info">
              <h1 class="user-name">{{ userStore.getUserName }}</h1>
              <p class="user-email">{{ userStore.user?.email || '未绑定邮箱' }}</p>
              <p class="user-bio">{{ userStore.user?.bio || '这个人很懒，什么都没有写~' }}</p>
              <p class="user-register">
                📅 加入于 {{ formatRegisterDate(userStore.user?.registerDate || userStore.user?.createdAt) }}
              </p>
            </div>
          </div>
          <div class="user-actions">
            <n-button type="primary" size="small" @click="openEditModal">
              <template #icon>
                <n-icon><CreateOutline /></n-icon>
              </template>
              编辑资料
            </n-button>
            <n-button type="error" size="small" @click="handleLogout">退出登录</n-button>
          </div>
        </div>

        <!-- 关注/粉丝统计 -->
        <div class="follow-stats">
          <div class="follow-stat-item" @click="goToFollows">
            <span class="stat-number">{{ userStore.followCount }}</span>
            <span class="stat-label">关注</span>
          </div>
          <div class="follow-divider"></div>
          <div class="follow-stat-item" @click="goToFollowers">
            <span class="stat-number">{{ userStore.followerCount }}</span>
            <span class="stat-label">粉丝</span>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card" @click="goToFavorites">
            <div class="stat-icon">❤️</div>
            <div class="stat-number">{{ stats.favoritesCount }}</div>
            <div class="stat-label">收藏</div>
          </div>
          <div class="stat-card" @click="goToHistory">
            <div class="stat-icon">👀</div>
            <div class="stat-number">{{ stats.historyCount }}</div>
            <div class="stat-label">观看记录</div>
          </div>
          <div class="stat-card" @click="goToMyComments">
            <div class="stat-icon">💬</div>
            <div class="stat-number">{{ stats.commentCount }}</div>
            <div class="stat-label">我的评论</div>
          </div>
        </div>

        <!-- 👇 新增：我发布的视频入口 -->
        <div class="my-videos-entry">
          <div class="quick-link" @click="goToMyVideos">
            <div class="quick-link-icon">📺</div>
            <div class="quick-link-info">
              <div class="quick-link-title">我发布的视频</div>
              <div class="quick-link-desc">查看和管理你发布的视频</div>
            </div>
            <div class="quick-link-arrow">›</div>
          </div>
        </div>

        <!-- 👇 新增：我发布的帖子入口 -->
        <div class="my-posts-entry">
          <div class="quick-link" @click="goToMyPosts">
            <div class="quick-link-icon">📝</div>
            <div class="quick-link-info">
              <div class="quick-link-title">我发布的帖子</div>
              <div class="quick-link-desc">查看和管理你发布的帖子</div>
            </div>
            <div class="quick-link-arrow">›</div>
          </div>
        </div>

        <!-- 快捷入口 -->
        <div class="quick-links">
          <div class="quick-link" @click="goToFavorites">
            <div class="quick-link-icon">❤️</div>
            <div class="quick-link-info">
              <div class="quick-link-title">我的收藏</div>
              <div class="quick-link-desc">查看收藏的视频</div>
            </div>
            <div class="quick-link-arrow">›</div>
          </div>
          <div class="quick-link" @click="goToHistory">
            <div class="quick-link-icon">🕐</div>
            <div class="quick-link-info">
              <div class="quick-link-title">观看历史</div>
              <div class="quick-link-desc">查看观看过的视频</div>
            </div>
            <div class="quick-link-arrow">›</div>
          </div>
          <div class="quick-link" @click="goToMyComments">
            <div class="quick-link-icon">💬</div>
            <div class="quick-link-info">
              <div class="quick-link-title">我的评论</div>
              <div class="quick-link-desc">查看发表过的评论</div>
            </div>
            <div class="quick-link-arrow">›</div>
          </div>
        </div>
      </div>

      <!-- 👇 别人的主页 -->
      <div v-else>
        <!-- 用户信息卡片（公开） -->
        <div class="user-profile-card">
          <div class="user-profile">
            <img :src="profileUser?.avatar || userStore.getUserAvatar" class="user-avatar-large" />
            <div class="user-info">
              <h1 class="user-name">{{ profileUser?.username || '用户' }}</h1>
              <p class="user-bio">{{ profileUser?.bio || '这个人很懒，什么都没有写~' }}</p>
              <p class="user-register">
                📅 加入于 {{ formatRegisterDate(profileUser?.createdAt) }}
              </p>
            </div>
          </div>
          <div class="user-actions">
            <!-- 关注按钮 -->
            <FollowButton
              v-if="profileUser && profileUser.id !== userStore.user?.id"
              :user-id="profileUser.id"
              @follow-change="loadProfile"
            />
          </div>
        </div>

        <!-- 关注/粉丝/视频统计 -->
        <div class="follow-stats">
          <div class="follow-stat-item">
            <span class="stat-number">{{ profileUser?.followCount || 0 }}</span>
            <span class="stat-label">关注</span>
          </div>
          <div class="follow-divider"></div>
          <div class="follow-stat-item">
            <span class="stat-number">{{ profileUser?.followerCount || 0 }}</span>
            <span class="stat-label">粉丝</span>
          </div>
          <div class="follow-divider"></div>
          <div class="follow-stat-item">
            <span class="stat-number">{{ profileUser?.videoCount || 0 }}</span>
            <span class="stat-label">视频</span>
          </div>
        </div>

        <!-- 该用户的视频列表 -->
        <div v-if="userVideos.length > 0" class="user-videos">
          <h3 class="section-title">📺 发布的视频</h3>
          <div class="video-grid">
            <VideoCard
              v-for="video in userVideos"
              :key="video.id"
              :video="video"
            />
          </div>
        </div>
        <div v-else-if="profileUser" class="empty-videos">
          <p>该用户还没有发布视频</p>
        </div>
      </div>
    </div>

    <!-- ===== 编辑资料弹窗 ===== -->
    <n-modal
      v-model:show="showEditModal"
      preset="card"
      title="📝 编辑个人资料"
      class="edit-modal"
      style="width: 480px; max-width: 90vw;"
    >
      <n-form
        ref="formRef"
        :model="editForm"
        :rules="formRules"
        label-placement="top"
      >
        <!-- 头像 -->
        <n-form-item label="头像">
          <div class="avatar-edit-section">
            <img :src="editForm.avatar" class="edit-avatar-preview" />
            <n-space>
              <n-input
                v-model:value="editForm.avatar"
                placeholder="输入头像 URL"
                style="width: 200px"
                size="small"
              />
              <n-button size="small" @click="randomAvatar">随机头像</n-button>
            </n-space>
          </div>
          <div class="avatar-presets">
            <img
              v-for="(url, index) in presetAvatars"
              :key="index"
              :src="url"
              class="preset-avatar"
              :class="{ active: editForm.avatar === url }"
              @click="editForm.avatar = url"
            />
          </div>
        </n-form-item>

        <!-- 昵称 -->
        <n-form-item label="昵称" path="username">
          <n-input
            v-model:value="editForm.username"
            placeholder="请输入昵称"
            maxlength="20"
          />
        </n-form-item>

        <!-- 邮箱 -->
        <n-form-item label="邮箱" path="email">
          <n-input
            v-model:value="editForm.email"
            placeholder="请输入邮箱"
          />
        </n-form-item>

        <!-- 个人简介 -->
        <n-form-item label="个人简介" path="bio">
          <n-input
            v-model:value="editForm.bio"
            type="textarea"
            placeholder="写点什么介绍一下自己吧..."
            :autosize="{ minRows: 2, maxRows: 4 }"
            maxlength="100"
          />
          <div class="bio-counter">{{ editForm.bio?.length || 0 }}/100</div>
        </n-form-item>

        <!-- 按钮 -->
        <n-form-item>
          <n-space>
            <n-button @click="showEditModal = false">取消</n-button>
            <n-button type="primary" :loading="saving" @click="handleSaveProfile">
              保存修改
            </n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NIcon,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  useMessage
} from 'naive-ui'
import { CreateOutline } from '@vicons/ionicons5'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { getUserProfile, getUserVideos } from '@/api/user'
import VideoCard from '@/components/video/VideoCard.vue'
import FollowButton from '@/components/user/FollowButton.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

// ===== 他人的用户信息 =====
const profileUser = ref(null)
const userVideos = ref([])
const loadingProfile = ref(false)

// ===== 判断是否为自己的主页 =====
const isOwnProfile = computed(() => {
  const userId = route.params.id
  // 如果是 'me' 或者 当前用户的ID
  if (userId === 'me') return true
  if (userStore.user && Number(userId) === userStore.user.id) return true
  // 如果没有登录，默认不是自己的主页
  return false
})

// ===== 加载他人主页数据 =====
const loadProfile = async () => {
  const userId = route.params.id
  if (userId === 'me' || !userStore.getIsLoggedIn) return

  loadingProfile.value = true
  try {
    const data = await getUserProfile(userId)
    if (data.success) {
      profileUser.value = data.data
      // 加载该用户的视频
      const videoData = await getUserVideos(userId)
      if (videoData.success) {
        userVideos.value = videoData.data || []
      }
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  } finally {
    loadingProfile.value = false
  }
}

// ===== 统计数据 =====
const stats = ref({
  favoritesCount: 0,
  historyCount: 0,
  commentCount: 0
})

// ===== 编辑弹窗 =====
const showEditModal = ref(false)
const saving = ref(false)
const formRef = ref(null)

// 预设头像
const presetAvatars = [
  'https://picsum.photos/seed/avatar1/200',
  'https://picsum.photos/seed/avatar2/200',
  'https://picsum.photos/seed/avatar3/200',
  'https://picsum.photos/seed/avatar4/200',
  'https://picsum.photos/seed/avatar5/200',
  'https://picsum.photos/seed/avatar6/200'
]

// 编辑表单
const editForm = reactive({
  avatar: '',
  username: '',
  email: '',
  bio: ''
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度为2-20个字符', trigger: 'blur' }
  ],
  email: [
    { 
      validator: (rule, value) => {
        if (!value) return true
        return value.includes('@')
      },
      message: '请输入有效的邮箱地址', 
      trigger: 'blur'
    }
  ]
}

// ===== 加载统计数据（从后端 API） =====
const loadStats = async () => {
  try {
    // 从后端获取统计数据
    const response = await fetch('https://ct-video-production.up.railway.app/api/users/me/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const data = await response.json()
    if (data.success) {
      stats.value = data.data
    } else {
      // 如果后端接口还没有，使用 store 的 fallback
      const fallbackStats = userStore.getUserStats()
      stats.value = {
        favoritesCount: fallbackStats.favoritesCount || 0,
        historyCount: fallbackStats.historyCount || 0,
        commentCount: fallbackStats.commentCount || 0
      }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    // 降级方案：使用 store 的统计数据
    const fallbackStats = userStore.getUserStats()
    stats.value = {
      favoritesCount: fallbackStats.favoritesCount || 0,
      historyCount: fallbackStats.historyCount || 0,
      commentCount: fallbackStats.commentCount || 0
    }
  }
}

// ===== 加载关注统计 =====
const loadFollowStats = async () => {
  if (userStore.user?.id) {
    await userStore.loadFollowStats(userStore.user.id)
  }
}

// ===== 打开编辑弹窗（填充当前数据） =====
const openEditModal = () => {
  const user = userStore.user
  if (user) {
    editForm.avatar = user.avatar || ''
    editForm.username = user.username || ''
    editForm.email = user.email || ''
    editForm.bio = user.bio || ''
  }
  showEditModal.value = true
}

// ===== 随机头像 =====
const randomAvatar = () => {
  const random = Math.floor(Math.random() * 1000)
  editForm.avatar = `https://picsum.photos/seed/avatar${random}/200`
}

// ===== 保存个人资料 =====
const handleSaveProfile = async () => {
  try {
    await formRef.value?.validate()

    saving.value = true

    const updated = userStore.updateUserProfile({
      avatar: editForm.avatar,
      username: editForm.username,
      email: editForm.email,
      bio: editForm.bio
    })

    loadStats()
    message.success('✅ 个人资料更新成功！')
    showEditModal.value = false
  } catch (error) {
    if (typeof error === 'string') {
      message.error(error)
    } else {
      message.error(error.message || '保存失败，请重试')
    }
  } finally {
    saving.value = false
  }
}

// ===== 格式化时间 =====
const formatRegisterDate = (date) => {
  if (!date) return '未知时间'
  return dayjs(date).format('YYYY年MM月DD日')
}

// ===== 退出登录 =====
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    router.push('/')
  }
}

// ===== 跳转 =====
const goToLogin = () => {
  router.push('/')
}

const goToFavorites = () => {
  router.push('/favorites')
}

const goToHistory = () => {
  router.push('/history')
}

const goToMyComments = () => {
  router.push('/my-comments')
}

// 👇 新增：跳转到我发布的视频页面
const goToMyVideos = () => {
  router.push('/my-videos')
}

// 👇 新增：跳转到我发布的帖子页面
const goToMyPosts = () => {
  router.push('/my-posts')
}

// ===== 跳转到关注/粉丝页面 =====
const goToFollows = () => {
  router.push(`/follow/${userStore.user.id}`)
}

const goToFollowers = () => {
  router.push(`/follow/${userStore.user.id}`)
}

// ===== 监听路由参数变化 =====
watch(
  () => route.params.id,
  () => {
    if (isOwnProfile.value) {
      // 自己的主页，加载自己的数据
      loadStats()
      loadFollowStats()
    } else {
      // 别人的主页
      loadProfile()
    }
  },
  { immediate: true }
)

// ===== 组件挂载 =====
onMounted(() => {
  // 如果未登录，跳转到登录
  if (!userStore.getIsLoggedIn) {
    return
  }
  
  if (isOwnProfile.value) {
    loadStats()
    loadFollowStats()
  } else {
    loadProfile()
  }
})
</script>

<style scoped>
.user-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

/* ===== 未登录状态 ===== */
.not-logged-in {
  text-align: center;
  padding: 80px 20px;
  background: #fff;
  border-radius: 12px;
}

.not-logged-in-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.not-logged-in h2 {
  font-size: 24px;
  color: #212121;
  margin-bottom: 8px;
}

.not-logged-in p {
  color: #999;
  margin-bottom: 20px;
}

/* ===== 用户信息卡片 ===== */
.user-profile-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 24px 28px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-avatar-large {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 22px;
  font-weight: 600;
  color: #212121;
}

.user-email {
  font-size: 14px;
  color: #999;
}

.user-bio {
  font-size: 14px;
  color: #666;
  max-width: 300px;
}

.user-register {
  font-size: 13px;
  color: #bbb;
}

.user-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* ===== 关注/粉丝统计 ===== */
.follow-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.follow-stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.follow-stat-item:hover {
  background: #f5f5f5;
}

.follow-stat-item .stat-number {
  font-size: 18px;
  font-weight: 700;
  color: #212121;
}

.follow-stat-item .stat-label {
  font-size: 14px;
  color: #999;
}

.follow-divider {
  width: 1px;
  height: 24px;
  background: #e8e8e8;
}

/* ===== 统计卡片 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #212121;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 2px;
}

/* ===== 👇 新增：我发布的视频入口 ===== */
.my-videos-entry {
  margin-bottom: 12px;
}

/* ===== 👇 新增：我发布的帖子入口 ===== */
.my-posts-entry {
  margin-bottom: 20px;
}

/* ===== 快捷入口 ===== */
.quick-links {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.quick-link {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
}

.quick-link:last-child {
  border-bottom: none;
}

.quick-link:hover {
  background: #f8f9fa;
}

.quick-link-icon {
  font-size: 22px;
  margin-right: 14px;
}

.quick-link-info {
  flex: 1;
}

.quick-link-title {
  font-size: 15px;
  font-weight: 500;
  color: #212121;
}

.quick-link-desc {
  font-size: 13px;
  color: #999;
}

.quick-link-arrow {
  font-size: 24px;
  color: #ccc;
}

/* ===== 他人的视频列表 ===== */
.user-videos {
  margin-top: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #212121;
  margin-bottom: 16px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.empty-videos {
  text-align: center;
  padding: 40px 0;
  color: #999;
  background: #fff;
  border-radius: 12px;
}

/* ===== 编辑弹窗 ===== */
.edit-modal :deep(.n-card-header) {
  font-size: 18px;
  font-weight: 600;
}

.avatar-edit-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.edit-avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e8e8e8;
}

.avatar-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.preset-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.preset-avatar:hover {
  transform: scale(1.1);
}

.preset-avatar.active {
  border-color: #fb7299;
  box-shadow: 0 0 0 2px rgba(251, 114, 153, 0.3);
}

.bio-counter {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .user-container {
    padding: 12px;
  }

  .user-profile-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
  }

  .user-profile {
    width: 100%;
  }

  .user-avatar-large {
    width: 56px;
    height: 56px;
  }

  .user-name {
    font-size: 18px;
  }

  .user-bio {
    max-width: 100%;
  }

  .user-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .stat-card {
    padding: 14px 10px;
  }

  .stat-number {
    font-size: 22px;
  }

  .quick-link {
    padding: 14px 16px;
  }

  .avatar-edit-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .avatar-presets {
    justify-content: center;
  }

  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}
</style>
