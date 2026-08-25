<template>
    <div class="comment-input-wrapper">
      <div class="comment-input-header">
        <img 
          v-if="userStore.getIsLoggedIn" 
          :src="userStore.getUserAvatar" 
          class="input-avatar" 
        />
        <div v-else class="input-avatar placeholder-avatar">?</div>
        <span class="input-tip">
          {{ userStore.getIsLoggedIn ? '发表你的精彩评论' : '请先登录再评论' }}
        </span>
      </div>
      
      <div class="comment-input-area">
        <n-input
          v-model:value="commentContent"
          type="textarea"
          placeholder="说点什么吧..."
          :autosize="{
            minRows: 2,
            maxRows: 6
          }"
          :disabled="!userStore.getIsLoggedIn"
        />
        
        <div class="comment-input-footer">
          <span class="char-count">{{ commentContent.length }}/500</span>
          <n-button 
            type="primary" 
            size="small"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            发布评论
          </n-button>
        </div>
      </div>
    </div>
</template>
  
<script setup>
  import { ref, computed } from 'vue'
  import { NInput, NButton } from 'naive-ui'
  import { useUserStore } from '@/stores/user'
  
  const emit = defineEmits(['submit'])
  
  const userStore = useUserStore()
  const commentContent = ref('')
  
  const canSubmit = computed(() => {
    return userStore.getIsLoggedIn && 
           commentContent.value.trim().length > 0 && 
           commentContent.value.length <= 500
  })
  
  const handleSubmit = () => {
    if (!canSubmit.value) return
    
    emit('submit', commentContent.value.trim())
    commentContent.value = ''
  }
</script>
  
<style scoped>
  .comment-input-wrapper {
    margin-bottom: 16px;
  }
  
  .comment-input-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .input-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .placeholder-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 14px;
  }
  
  .input-tip {
    font-size: 13px;
    color: #999;
  }
  
  .comment-input-area {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 12px;
  }
  
  .comment-input-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }
  
  .char-count {
    font-size: 12px;
    color: #999;
  }
  
  /* Naive UI 输入框样式调整 */
  .comment-input-area :deep(.n-input) {
    background: transparent;
  }
  
  .comment-input-area :deep(.n-input .n-input__textarea-el) {
    font-size: 14px;
  }
</style>