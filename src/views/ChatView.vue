<template>
  <div class="chat-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">💬 聊天社区</h1>
      <span class="post-total">共 {{ posts.length }} 个帖子</span>
    </div>

    <!-- 帖子列表 -->
    <PostList
      :posts="posts"
      @post-created="loadPosts"
      @post-deleted="loadPosts"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import PostList from '@/components/community/PostList.vue'
import { useCommunityStore } from '@/stores/community'

const communityStore = useCommunityStore()

// 帖子列表
const posts = computed(() => communityStore.getAllPosts)

// 👇 修改：从后端获取帖子（而不是从 localStorage）
const loadPosts = async () => {
  await communityStore.fetchPosts()
}

// 组件挂载
onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.chat-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #212121;
  margin: 0;
}

.post-total {
  font-size: 14px;
  color: #999;
}

@media (max-width: 768px) {
  .chat-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .page-title {
    font-size: 20px;
  }
}
</style>