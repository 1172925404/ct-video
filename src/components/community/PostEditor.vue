<template>
  <div class="post-editor">
    <!-- 头像 -->
    <div class="editor-header">
      <img
        v-if="userStore.getIsLoggedIn"
        :src="userStore.getUserAvatar"
        class="editor-avatar"
      />
      <div v-else class="editor-avatar placeholder">?</div>
      <span class="editor-tip">
        {{ userStore.getIsLoggedIn ? '发布新帖子' : '请先登录再发帖' }}
      </span>
    </div>

    <div class="editor-body">
      <!-- 标题输入 -->
      <n-input
        v-model:value="title"
        placeholder="请输入帖子标题..."
        :disabled="!userStore.getIsLoggedIn"
        maxlength="100"
        class="title-input"
      />
      <div class="title-counter">{{ title.length }}/100</div>

      <!-- 内容输入 -->
      <n-input
        v-model:value="content"
        type="textarea"
        placeholder="请输入帖子内容..."
        :autosize="{ minRows: 4, maxRows: 10 }"
        :disabled="!userStore.getIsLoggedIn"
        maxlength="5000"
        class="content-input"
      />

      <!-- 图片上传 -->
      <div class="image-upload-section">
        <!-- 👇 修改：预览列表用 computed 属性 -->
        <div v-if="imagePreviews.length > 0" class="image-preview-list">
          <div
            v-for="(preview, index) in imagePreviews"
            :key="index"
            class="image-preview-item"
          >
            <img :src="preview" class="preview-image" />
            <button class="remove-image" @click="removeImage(index)">×</button>
          </div>
        </div>

        <div class="upload-actions">
          <n-button
            size="small"
            :disabled="!userStore.getIsLoggedIn || imageFiles.length >= 6"
            @click="triggerFileInput"
          >
            <template #icon>
              <n-icon><ImageOutline /></n-icon>
            </template>
            添加图片 ({{ imageFiles.length }}/6)
          </n-button>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            multiple
            class="hidden-input"
            @change="handleFileSelect"
          />
          <span v-if="uploading" class="uploading-text">上传中...</span>
        </div>
      </div>

      <!-- 发布按钮 -->
      <div class="editor-footer">
        <span class="char-count">{{ content.length }}/5000</span>
        <n-button
          type="primary"
          :loading="loading"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          发布帖子
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NInput, NButton, NIcon } from 'naive-ui'
import { ImageOutline } from '@vicons/ionicons5'
import { useCommunityStore } from '@/stores/community'
import { useUserStore } from '@/stores/user'

const emit = defineEmits(['post-created'])

const communityStore = useCommunityStore()
const userStore = useUserStore()

const title = ref('')
const content = ref('')
// 存储 File 对象
const imageFiles = ref([])
const loading = ref(false)
const uploading = ref(false)
const fileInputRef = ref(null)

// 👇 新增：计算属性，生成预览 URL
const imagePreviews = computed(() => {
  return imageFiles.value
    .filter(file => file !== null && file !== undefined)
    .map(file => URL.createObjectURL(file))
})

const canSubmit = computed(() => {
  return userStore.getIsLoggedIn &&
         title.value.trim().length > 0 &&
         content.value.trim().length > 0 &&
         !uploading.value
})

// 触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileSelect = async (e) => {
  const files = e.target.files
  if (!files || files.length === 0) return

  // 限制最多6张
  const remaining = 6 - imageFiles.value.length
  const selectedFiles = Array.from(files).slice(0, remaining)

  if (selectedFiles.length === 0) {
    alert('最多只能上传6张图片')
    return
  }

  uploading.value = true

  try {
    for (const file of selectedFiles) {
      // 检查文件大小（限制5MB，与后端一致）
      if (file.size > 5 * 1024 * 1024) {
        alert(`图片 ${file.name} 超过5MB，请压缩后上传`)
        continue
      }
      // 检查文件格式
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        alert(`图片 ${file.name} 格式不支持，请上传 JPG、PNG、GIF、WEBP 格式`)
        continue
      }
      // 直接存储 File 对象
      imageFiles.value.push(file)
    }
  } catch (error) {
    console.error('图片处理失败:', error)
    alert('图片处理失败，请重试')
  } finally {
    uploading.value = false
    // 清空 input，允许重复选择同一文件
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// 移除图片
const removeImage = (index) => {
  imageFiles.value.splice(index, 1)
}

// 发布帖子
const handleSubmit = async () => {
  if (!canSubmit.value) return

  loading.value = true

  try {
    const user = userStore.user
    // 传入 File 对象数组
    await communityStore.createPost(
      user.username,
      user.avatar,
      title.value.trim(),
      content.value.trim(),
      imageFiles.value  // 直接传入 File 对象
    )

    // 重置表单
    title.value = ''
    content.value = ''
    imageFiles.value = []

    emit('post-created')
  } catch (error) {
    console.error('发布失败:', error)
    alert(error.message || '发布失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.post-editor {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.editor-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.editor-avatar.placeholder {
  background: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.editor-tip {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.editor-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.title-input :deep(.n-input__input-el) {
  font-size: 16px;
  font-weight: 500;
}

.title-counter {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: -6px;
}

.content-input :deep(.n-input__textarea-el) {
  font-size: 14px;
  line-height: 1.7;
}

.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-image:hover {
  background: rgba(0, 0, 0, 0.8);
}

.upload-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hidden-input {
  display: none;
}

.uploading-text {
  font-size: 13px;
  color: #999;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.char-count {
  font-size: 12px;
  color: #999;
}
</style>
