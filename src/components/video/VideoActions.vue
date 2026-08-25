<template>
  <div class="video-actions">
    <!-- 点赞 -->
    <n-button 
      class="action-btn" 
      :type="video._liked ? 'primary' : 'default'"
      @click="handleLike"
    >
      <template #icon>
        <n-icon size="20">
          <ThumbsUp v-if="video._liked" />
          <ThumbsUpOutline v-else />
        </n-icon>
      </template>
      {{ formatNumber(video.likes) }}
    </n-button>

    <!-- 投币 -->
    <n-button class="action-btn" @click="handleCoin">
      <template #icon>
        <n-icon size="20"><CashOutline /></n-icon>
      </template>
      投币
    </n-button>

    <!-- 收藏 -->
    <n-button 
      class="action-btn" 
      :type="isFavorited ? 'primary' : 'default'"
      @click="handleFavorite"
    >
      <template #icon>
        <n-icon size="20">
          <Heart v-if="isFavorited" />
          <HeartOutline v-else />
        </n-icon>
      </template>
      {{ isFavorited ? '已收藏' : '收藏' }}
    </n-button>

    <!-- 分享 -->
    <n-button class="action-btn" @click="handleShare">
      <template #icon>
        <n-icon size="20"><ShareSocialOutline /></n-icon>
      </template>
      分享
    </n-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { 
  ThumbsUp, 
  ThumbsUpOutline,
  CashOutline,
  Heart,
  HeartOutline,
  ShareSocialOutline
} from '@vicons/ionicons5'
import { useVideoStore } from '@/stores/video'

const props = defineProps({
  video: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['like', 'favorite'])

const videoStore = useVideoStore()

// 👇 修改：优先使用 video._favorited（后端返回），其次使用 store 中的 favorites 列表
const isFavorited = computed(() => {
  // 如果视频数据中有 _favorited 字段，优先使用它（刷新后从后端获取）
  if (props.video._favorited !== undefined && props.video._favorited !== null) {
    return props.video._favorited
  }
  // 兜底：使用 store 中的 favorites 列表
  return videoStore.isFavorited(props.video.id)
})

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num
}

const handleLike = () => {
  emit('like')
}

const handleCoin = () => {
  console.log('投币')
}

const handleFavorite = () => {
  emit('favorite')
}

const handleShare = () => {
  console.log('分享')
}
</script>

<style scoped>
.video-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  min-width: 72px;
  justify-content: center;
  border-radius: 20px;
}

.action-btn :deep(.n-button__content) {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>