<template>
    <div class="upload-container">
      <h1 class="page-title">📤 上传视频</h1>
  
      <div class="upload-card">
        <!-- 视频文件上传区域 -->
        <div class="file-drop-zone" @dragover.prevent @drop.prevent="handleDrop">
          <div v-if="!videoFile" class="drop-content">
            <div class="drop-icon">🎬</div>
            <p>拖拽视频文件到此处，或点击选择</p>
            <p class="drop-hint">支持 MP4、WebM、MOV 格式，最大 100MB</p>
            <n-button type="primary" @click="triggerVideoInput">选择视频</n-button>
            <input
              ref="videoInputRef"
              type="file"
              accept="video/*"
              class="hidden-input"
              @change="handleVideoSelect"
            />
          </div>
          <div v-else class="file-selected">
            <div class="file-info">
              <span class="file-icon">🎬</span>
              <span class="file-name">{{ videoFile.name }}</span>
              <span class="file-size">{{ formatFileSize(videoFile.size) }}</span>
            </div>
            <n-button size="small" @click="removeVideo">重新选择</n-button>
          </div>
        </div>
  
        <!-- 表单 -->
        <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top">
          <!-- 标题 -->
          <n-form-item label="视频标题" path="title">
            <n-input
              v-model:value="formData.title"
              placeholder="请输入视频标题"
              maxlength="100"
            />
          </n-form-item>
  
          <!-- 描述 -->
          <n-form-item label="视频描述" path="description">
            <n-input
              v-model:value="formData.description"
              type="textarea"
              placeholder="请输入视频描述"
              :autosize="{ minRows: 2, maxRows: 4 }"
              maxlength="500"
            />
          </n-form-item>
  
          <!-- 分类 -->
          <n-form-item label="分类" path="category">
            <n-select
              v-model:value="formData.category"
              :options="categoryOptions"
              placeholder="请选择分类"
            />
          </n-form-item>
  
          <!-- 标签 -->
          <n-form-item label="标签">
            <div class="tag-input-area">
              <n-input
                v-model:value="tagInput"
                placeholder="输入标签后按回车添加"
                @keyup.enter="addTag"
                maxlength="20"
              />
              <n-button size="small" @click="addTag">添加</n-button>
            </div>
            <div class="tag-list">
              <span
                v-for="(tag, index) in formData.tags"
                :key="index"
                class="tag-item"
              >
                #{{ tag }}
                <span class="tag-remove" @click="removeTag(index)">×</span>
              </span>
            </div>
          </n-form-item>
  
          <!-- 封面图 -->
          <n-form-item label="封面图">
            <div class="cover-upload">
              <div v-if="coverFile" class="cover-preview">
                <img :src="coverPreviewUrl" class="cover-image" />
                <n-button size="small" @click="removeCover">重新选择</n-button>
              </div>
              <div v-else class="cover-drop" @click="triggerCoverInput">
                <span>点击选择封面图</span>
                <span class="cover-hint">支持 JPG、PNG 格式，建议 16:9 比例</span>
                <input
                  ref="coverInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden-input"
                  @change="handleCoverSelect"
                />
              </div>
            </div>
          </n-form-item>
  
          <!-- 上传进度 -->
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="progress-area">
            <n-progress
              type="line"
              :percentage="uploadProgress"
              status="active"
            />
          </div>
  
          <!-- 按钮 -->
          <div class="form-actions">
            <n-button @click="goBack">取消</n-button>
            <n-button
              type="primary"
              :loading="uploading"
              :disabled="!canSubmit"
              @click="handleSubmit"
            >
              {{ uploading ? '上传中...' : '发布视频' }}
            </n-button>
          </div>
        </n-form>
      </div>
    </div>
</template>
  
<script setup>
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    NButton,
    NForm,
    NFormItem,
    NInput,
    NSelect,
    NProgress,
    useMessage
  } from 'naive-ui'
  import { useVideoStore } from '@/stores/video'
  import { uploadVideo, uploadThumbnail } from '@/api/upload'
  
  const router = useRouter()
  const message = useMessage()
  const videoStore = useVideoStore()
  
  // ===== 表单数据 =====
  const formData = ref({
    title: '',
    description: '',
    category: 'recommend',
    tags: []
  })
  
  const tagInput = ref('')
  const videoFile = ref(null)
  const coverFile = ref(null)
  const coverPreviewUrl = ref('')
  const uploadProgress = ref(0)
  const uploading = ref(false)
  
  const videoInputRef = ref(null)
  const coverInputRef = ref(null)
  const formRef = ref(null)
  
  // ===== 分类选项 =====
  const categoryOptions = [
    { label: '🔥 推荐', value: 'recommend' },
    { label: '📈 热门', value: 'hot' },
    { label: '🆕 最新', value: 'latest' },
    { label: '⭐ 关注', value: 'follow' }
  ]
  
  // ===== 表单验证规则 =====
  const rules = {
    title: [
      { required: true, message: '请输入视频标题', trigger: 'blur' },
      { min: 2, max: 100, message: '标题长度为2-100个字符', trigger: 'blur' }
    ],
    category: [
      { required: true, message: '请选择分类', trigger: 'change' }
    ]
  }
  
  // ===== 计算属性 =====
  const canSubmit = computed(() => {
    return videoFile.value && formData.value.title.trim() && !uploading.value
  })
  
  // ===== 方法 =====
  const triggerVideoInput = () => {
    videoInputRef.value?.click()
  }
  
  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        message.error('视频文件超过100MB，请压缩后上传')
        return
      }
      videoFile.value = file
    }
    e.target.value = ''
  }
  
  const handleDrop = (e) => {
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        message.error('视频文件超过100MB，请压缩后上传')
        return
      }
      videoFile.value = file
    }
  }
  
  const removeVideo = () => {
    videoFile.value = null
  }
  
  const triggerCoverInput = () => {
    coverInputRef.value?.click()
  }
  
  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        message.error('封面图超过5MB，请压缩后上传')
        return
      }
      coverFile.value = file
      coverPreviewUrl.value = URL.createObjectURL(file)
    }
    e.target.value = ''
  }
  
  const removeCover = () => {
    coverFile.value = null
    coverPreviewUrl.value = ''
  }
  
  const addTag = () => {
    const tag = tagInput.value.trim()
    if (!tag) return
    if (formData.value.tags.length >= 10) {
      message.warning('最多添加10个标签')
      return
    }
    if (formData.value.tags.includes(tag)) {
      message.warning('标签已存在')
      return
    }
    formData.value.tags.push(tag)
    tagInput.value = ''
  }
  
  const removeTag = (index) => {
    formData.value.tags.splice(index, 1)
  }
  
  // ===== 提交 =====
  const handleSubmit = async () => {
    try {
      await formRef.value?.validate()
    } catch {
      return
    }
  
    if (!videoFile.value) {
      message.error('请选择视频文件')
      return
    }
  
    uploading.value = true
    uploadProgress.value = 0
  
    try {
      // 1. 上传视频
      const formDataObj = new FormData()
      formDataObj.append('video', videoFile.value)
      formDataObj.append('title', formData.value.title.trim())
      formDataObj.append('description', formData.value.description.trim())
      formDataObj.append('category', formData.value.category)
      formDataObj.append('tags', JSON.stringify(formData.value.tags))
  
      const result = await uploadVideo(formDataObj, (progress) => {
        uploadProgress.value = progress
      })
  
      if (result.success) {
        const videoId = result.data.id
  
        // 2. 如果有封面图，上传封面图
        if (coverFile.value) {
          try {
            await uploadThumbnail(videoId, coverFile.value)
          } catch (error) {
            console.warn('封面图上传失败:', error)
            message.warning('视频上传成功，但封面图上传失败')
          }
        }
  
        message.success('🎉 视频发布成功！')
        
        // 刷新视频列表
        await videoStore.fetchVideos()
        
        // 跳转到视频详情页
        router.push(`/video/${videoId}`)
      }
    } catch (error) {
      message.error(error.message || '上传失败，请重试')
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }
  
  const goBack = () => {
    router.back()
  }
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / 1024 / 1024).toFixed(1) + 'MB'
  }
</script>
  
<style scoped>
  .upload-container {
    max-width: 700px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: #212121;
    margin-bottom: 24px;
  }
  
  .upload-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px 28px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
  
  /* ===== 文件拖拽区域 ===== */
  .file-drop-zone {
    border: 2px dashed #d9d9d9;
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    margin-bottom: 20px;
    transition: all 0.3s;
    cursor: pointer;
  }
  
  .file-drop-zone:hover {
    border-color: #fb7299;
    background: #fdf4f7;
  }
  
  .drop-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  
  .drop-content p {
    color: #666;
    margin: 4px 0;
  }
  
  .drop-hint {
    font-size: 13px;
    color: #999 !important;
    margin-bottom: 12px !important;
  }
  
  .hidden-input {
    display: none;
  }
  
  .file-selected {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  
  .file-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .file-icon {
    font-size: 28px;
  }
  
  .file-name {
    font-weight: 500;
    color: #212121;
  }
  
  .file-size {
    font-size: 13px;
    color: #999;
  }
  
  /* ===== 标签 ===== */
  .tag-input-area {
    display: flex;
    gap: 8px;
  }
  
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  
  .tag-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #fce8ee;
    color: #fb7299;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 13px;
  }
  
  .tag-remove {
    cursor: pointer;
    font-size: 16px;
    color: #999;
  }
  
  .tag-remove:hover {
    color: #fb7299;
  }
  
  /* ===== 封面图 ===== */
  .cover-upload {
    width: 100%;
  }
  
  .cover-drop {
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    padding: 30px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .cover-drop:hover {
    border-color: #fb7299;
    background: #fdf4f7;
  }
  
  .cover-hint {
    font-size: 12px;
    color: #999;
  }
  
  .cover-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  
  .cover-image {
    width: 100%;
    max-width: 320px;
    max-height: 180px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e8e8e8;
  }
  
  /* ===== 进度条 ===== */
  .progress-area {
    margin: 16px 0;
  }
  
  /* ===== 按钮 ===== */
  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
  
  /* ===== 响应式 ===== */
  @media (max-width: 768px) {
    .upload-container {
      padding: 12px;
    }
  
    .upload-card {
      padding: 16px;
    }
  
    .file-drop-zone {
      padding: 24px 16px;
    }
  
    .file-selected {
      flex-direction: column;
      align-items: flex-start;
    }
  
    .form-actions {
      flex-direction: column;
    }
  
    .form-actions .n-button {
      width: 100%;
    }
  
    .tag-input-area {
      flex-direction: column;
    }
  }
</style>