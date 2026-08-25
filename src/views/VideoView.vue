<template>
  <div class="video-detail-container">
    <div v-if="video" class="video-detail-wrapper">
      <VideoPlayer 
        :video="video" 
        @like="handleLike"
        @favorite="handleFavorite"
      />

      <!-- 👇 新增：操作按钮（仅作者可见） -->
      <div v-if="isAuthor" class="video-actions-bar">
        <n-button size="small" @click="goToEdit">
          <template #icon>
            <n-icon><CreateOutline /></n-icon>
          </template>
          编辑视频
        </n-button>
        <n-button size="small" type="error" @click="handleDelete">
          <template #icon>
            <n-icon><TrashOutline /></n-icon>
          </template>
          删除视频
        </n-button>
      </div>

      <CommentList :video-id="video.id" />
    </div>

    <div v-else-if="loading" class="loading-state">
      <n-spin size="large" />
      <p>加载中...</p>
    </div>

    <div v-else class="loading-state">
      <p>视频不存在</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NSpin, NButton, NIcon, useDialog, useMessage } from 'naive-ui'
import { CreateOutline, TrashOutline } from '@vicons/ionicons5'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import CommentList from '@/components/comment/CommentList.vue'
import { useVideoStore } from '@/stores/video'
import { useUserStore } from '@/stores/user'
import { useCommentStore } from '@/stores/comment'
import { deleteVideo } from '@/api/video'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const videoStore = useVideoStore()
const userStore = useUserStore()
const commentStore = useCommentStore()

const video = ref(null)
const loading = ref(false)

// 👇 判断是否是作者
const isAuthor = computed(() => {
  if (!video.value || !userStore.user) return false
  return video.value.authorId === userStore.user.id
})

// 加载视频的函数
const loadVideo = async () => {
  const id = Number(route.params.id)
  if (isNaN(id)) {
    console.error('无效的视频ID')
    return
  }

  loading.value = true
  try {
    const found = await videoStore.setCurrentVideo(id)
    if (found) {
      video.value = found
      await videoStore.addToHistory(id)
      await commentStore.fetchComments(id)
    } else {
      console.error('视频不存在:', id)
    }
  } catch (error) {
    console.error('加载视频失败:', error)
  } finally {
    loading.value = false
  }
}

// 点赞
const handleLike = async () => {
  if (video.value) {
    try {
      await videoStore.toggleLike(video.value.id)
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }
}

// 收藏
const handleFavorite = async () => {
  if (video.value) {
    try {
      await videoStore.toggleFavorite(video.value.id)
    } catch (error) {
      console.error('收藏失败:', error)
    }
  }
}

// 👇 新增：跳转到编辑页面
const goToEdit = () => {
  router.push(`/video/edit/${video.value.id}`)
}

// 👇 新增：删除视频
const handleDelete = () => {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个视频吗？删除后无法恢复！',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteVideo(video.value.id)
        await videoStore.fetchVideos()
        message.success('✅ 视频已删除')
        router.push('/')
      } catch (error) {
        console.error('删除失败:', error)
        message.error(error.message || '删除失败，请重试')
      }
    }
  })
}

// 监听路由参数变化
watch(
  () => route.params.id,
  () => {
    loadVideo()
  }
)

// 组件挂载时加载
onMounted(() => {
  loadVideo()
})
</script>

<style scoped>
.video-detail-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}

.video-detail-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 👇 新增：操作按钮栏 */
.video-actions-bar {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #fff;
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
  color: #999;
}

@media (max-width: 768px) {
  .video-detail-container {
    padding: 12px;
  }

  .video-actions-bar {
    flex-direction: column;
  }
}
</style>