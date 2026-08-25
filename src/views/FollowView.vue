<template>
    <div class="follow-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'follows' }"
            @click="activeTab = 'follows'"
          >
            关注 ({{ followList.length }})
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'followers' }"
            @click="activeTab = 'followers'"
          >
            粉丝 ({{ followerList.length }})
          </button>
        </div>
        <n-button quaternary size="small" @click="goBack">
          <template #icon>
            <n-icon><ArrowBack /></n-icon>
          </template>
          返回
        </n-button>
      </div>
  
      <!-- 用户列表 -->
      <div v-if="displayList.length > 0" class="user-list">
        <div
          v-for="user in displayList"
          :key="user.id"
          class="user-item"
          @click="goToUser(user.id)"
        >
          <img :src="user.avatar" class="user-avatar" />
          <div class="user-info">
            <span class="user-name">{{ user.username }}</span>
            <span v-if="user.bio" class="user-bio">{{ user.bio }}</span>
            <span v-else class="user-bio placeholder">这个人很懒，什么都没有写~</span>
          </div>
          <!-- 关注按钮（仅在粉丝列表且是当前用户时显示） -->
          <FollowButton
            v-if="activeTab === 'followers' && user.id !== currentUserId"
            :user-id="user.id"
            size="small"
            @follow-change="handleFollowChange"
          />
        </div>
      </div>
  
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>{{ activeTab === 'follows' ? '还没有关注任何人' : '还没有粉丝' }}</h3>
        <p>
          {{ activeTab === 'follows' ? '去发现更多有趣的用户吧！' : '发布更多内容吸引粉丝吧！' }}
        </p>
        <n-button type="primary" @click="goHome">去首页</n-button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { NButton, NIcon } from 'naive-ui'
  import { ArrowBack } from '@vicons/ionicons5'
  import FollowButton from '@/components/user/FollowButton.vue'
  import { useUserStore } from '@/stores/user'
  
  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  
  const activeTab = ref('follows')  // 'follows' 或 'followers'
  const followList = ref([])
  const followerList = ref([])
  const currentUserId = computed(() => userStore.user?.id)
  
  // 获取目标用户ID（从路由参数获取，或默认当前用户）
  const targetUserId = computed(() => {
    const id = parseInt(route.params.id)
    return isNaN(id) ? currentUserId.value : id
  })
  
  // 当前显示的列表
  const displayList = computed(() => {
    return activeTab.value === 'follows' ? followList.value : followerList.value
  })
  
  // ===== 加载数据 =====
  const loadData = async () => {
    if (!targetUserId.value) return
  
    try {
      // 加载关注列表
      const followsData = await userStore.loadFollows(targetUserId.value)
      followList.value = followsData || []
  
      // 加载粉丝列表
      const followersData = await userStore.loadFollowers(targetUserId.value)
      followerList.value = followersData || []
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }
  
  // ===== 方法 =====
  const goBack = () => {
    router.back()
  }
  
  const goHome = () => {
    router.push('/')
  }
  
  const goToUser = (userId) => {
    if (userId === currentUserId.value) {
      router.push('/user/me')
    } else {
      router.push(`/user/${userId}`)
    }
  }
  
  const handleFollowChange = () => {
    // 刷新列表
    loadData()
  }
  
  // ===== 生命周期 =====
  onMounted(() => {
    loadData()
  })
  
  // 监听路由参数变化
  watch(
    () => route.params.id,
    () => {
      loadData()
    }
  )
  </script>
  
  <style scoped>
  .follow-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .header-tabs {
    display: flex;
    gap: 0;
    background: #f0f0f0;
    border-radius: 20px;
    padding: 3px;
  }
  
  .tab-btn {
    padding: 6px 20px;
    border: none;
    border-radius: 18px;
    background: transparent;
    color: #666;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .tab-btn.active {
    background: #fff;
    color: #fb7299;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  .tab-btn:hover:not(.active) {
    color: #333;
  }
  
  .user-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .user-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    background: #fff;
    border-radius: 12px;
    cursor: pointer;
    transition: box-shadow 0.3s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
  
  .user-item:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  
  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  
  .user-info {
    flex: 1;
    min-width: 0;
  }
  
  .user-name {
    font-size: 15px;
    font-weight: 500;
    color: #212121;
    display: block;
  }
  
  .user-bio {
    font-size: 13px;
    color: #999;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .user-bio.placeholder {
    color: #ccc;
  }
  
  .empty-state {
    text-align: center;
    padding: 60px 0;
  }
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  
  .empty-state h3 {
    font-size: 18px;
    color: #212121;
    margin-bottom: 4px;
  }
  
  .empty-state p {
    color: #999;
    margin-bottom: 20px;
  }
  
  @media (max-width: 768px) {
    .follow-container {
      padding: 12px;
    }
  
    .user-item {
      padding: 12px 14px;
    }
  
    .user-avatar {
      width: 40px;
      height: 40px;
    }
  
    .tab-btn {
      padding: 4px 14px;
      font-size: 13px;
    }
  }
  </style>