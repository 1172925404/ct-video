<template>
    <n-button
      :type="isFollowing ? 'default' : 'primary'"
      :size="size || 'medium'"
      :loading="loading"
      :disabled="!userStore.getIsLoggedIn || userId === userStore.user?.id"
      @click.stop="handleToggle"
      class="follow-btn"
    >
      {{ buttonText }}
    </n-button>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { NButton } from 'naive-ui'
  import { useUserStore } from '@/stores/user'
  
  const props = defineProps({
    userId: {
      type: Number,
      required: true
    },
    size: {
      type: String,
      default: 'medium'
    }
  })
  
  const emit = defineEmits(['follow-change'])
  
  const userStore = useUserStore()
  const loading = ref(false)
  const isFollowing = ref(false)
  
  // 按钮文本
  const buttonText = computed(() => {
    if (!userStore.getIsLoggedIn) return '关注'
    if (props.userId === userStore.user?.id) return '我'
    return isFollowing.value ? '已关注' : '关注'
  })
  
  // 切换关注状态
  const handleToggle = async () => {
    if (!userStore.getIsLoggedIn) {
      // 提示登录
      alert('请先登录')
      return
    }
  
    if (props.userId === userStore.user?.id) {
      return
    }
  
    loading.value = true
    try {
      if (isFollowing.value) {
        await userStore.unfollowUser(props.userId)
        isFollowing.value = false
      } else {
        await userStore.followUser(props.userId)
        isFollowing.value = true
      }
      emit('follow-change')
    } catch (error) {
      console.error('操作失败:', error)
      alert(error.message || '操作失败，请重试')
    } finally {
      loading.value = false
    }
  }
  
  // 加载关注状态
  const loadFollowStatus = async () => {
    if (!userStore.getIsLoggedIn || props.userId === userStore.user?.id) {
      isFollowing.value = false
      return
    }
    try {
      isFollowing.value = await userStore.checkIsFollowing(props.userId)
    } catch (error) {
      console.error('加载关注状态失败:', error)
    }
  }
  
  // 监听用户登录状态变化
  watch(() => userStore.isLoggedIn, () => {
    loadFollowStatus()
  })
  
  // 监听 userId 变化
  watch(() => props.userId, () => {
    loadFollowStatus()
  })
  
  onMounted(() => {
    loadFollowStatus()
  })
  </script>
  
  <style scoped>
  .follow-btn {
    min-width: 64px;
    border-radius: 16px;
    flex-shrink: 0;
  }
  </style>