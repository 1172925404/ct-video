<template>
    <div class="video-edit-container">
      <h1 class="page-title">✏️ 编辑视频</h1>
  
      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
        <p>加载中...</p>
      </div>
  
      <div v-else-if="video" class="edit-card">
        <!-- 封面图 -->
        <div class="cover-section">
          <div class="cover-preview">
            <img :src="coverPreview" class="cover-image" />
          </div>
          <div class="cover-actions">
            <n-button size="small" @click="triggerCoverInput">更换封面</n-button>
            <input
              ref="coverInputRef"
              type="file"
              accept="image/*"
              class="hidden-input"
              @change="handleCoverSelect"
            />
            <span v-if="coverFile" class="file-name">{{ coverFile.name }}</span>
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
  
          <!-- 按钮 -->
          <div class="form-actions">
            <n-button @click="goBack">取消</n-button>
            <n-button
              type="primary"
              :loading="saving"
              :disabled="!canSubmit"
              @click="handleSave"
            >
              保存修改
            </n-button>
            <n-button
              type="error"
              :loading="deleting"
              @click="handleDelete"
            >
              删除视频
            </n-button>
          </div>
        </n-form>
      </div>
  
      <div v-else class="empty-state">
        <p>视频不存在或已被删除</p>
        <n-button type="primary" @click="goHome">去首页</n-button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import {
    NButton,
    NForm,
    NFormItem,
    NInput,
    NSpin,
    useMessage,
    useDialog
  } from 'naive-ui'
  import { useVideoStore } from '@/stores/video'
  import { updateVideo, deleteVideo, uploadThumbnail } from '@/api/video'
  
  const route = useRoute()
  const router = useRouter()
  const message = useMessage()
  const dialog = useDialog()
  const videoStore = useVideoStore()
  
  const video = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const formRef = ref(null)
  const coverInputRef = ref(null)
  const coverFile = ref(null)
  
  // 表单数据
  const formData = reactive({
    title: '',
    description: '',
    tags: []
  })
  
  const tagInput = ref('')
  
  // 封面预览
  const coverPreview = computed(() => {
    if (coverFile.value) {
      return URL.createObjectURL(coverFile.value)
    }
    if (video.value?.cover) {
      return `http://localhost:3000${video.value.cover}`
    }
    return ''
  })
  
  // 表单验证规则
  const rules = {
    title: [
      { required: true, message: '请输入视频标题', trigger: 'blur' },
      { min: 2, max: 100, message: '标题长度为2-100个字符', trigger: 'blur' }
    ]
  }
  
  // 是否可以提交
  const canSubmit = computed(() => {
    return formData.title.trim().length > 0 && !saving.value
  })
  
  // ===== 加载视频数据 =====
  const loadVideo = async () => {
    const id = Number(route.params.id)
    if (isNaN(id)) {
      message.error('无效的视频ID')
      router.push('/')
      return
    }
  
    loading.value = true
    try {
      const found = await videoStore.fetchVideoDetail(id)
      if (found) {
        video.value = found
        // 检查是否是作者
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        if (video.value.authorId && video.value.authorId !== currentUser.id) {
          message.warning('你没有权限编辑此视频')
          router.push(`/video/${id}`)
          return
        }
        // 填充表单
        formData.title = found.title || ''
        formData.description = found.description || ''
        formData.tags = found.tags || []
      } else {
        message.error('视频不存在')
        router.push('/')
      }
    } catch (error) {
      console.error('加载视频失败:', error)
      message.error('加载视频失败，请重试')
    } finally {
      loading.value = false
    }
  }
  
  // ===== 触发封面选择 =====
  const triggerCoverInput = () => {
    coverInputRef.value?.click()
  }
  
  // ===== 选择封面图 =====
  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        message.error('封面图超过5MB，请压缩后上传')
        return
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        message.error('请上传 JPG、PNG 或 WEBP 格式的图片')
        return
      }
      coverFile.value = file
    }
    e.target.value = ''
  }
  
  // ===== 标签操作 =====
  const addTag = () => {
    const tag = tagInput.value.trim()
    if (!tag) return
    if (formData.tags.length >= 10) {
      message.warning('最多添加10个标签')
      return
    }
    if (formData.tags.includes(tag)) {
      message.warning('标签已存在')
      return
    }
    formData.tags.push(tag)
    tagInput.value = ''
  }
  
  const removeTag = (index) => {
    formData.tags.splice(index, 1)
  }
  
  // ===== 保存修改 =====
  const handleSave = async () => {
    try {
      await formRef.value?.validate()
    } catch {
      return
    }
  
    saving.value = true
    try {
      const id = video.value.id
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags: formData.tags
      }
  
      // 更新视频信息
      await updateVideo(id, updateData)
  
      // 如果有新封面图，上传封面
      if (coverFile.value) {
        await uploadThumbnail(id, coverFile.value)
      }
  
      message.success('✅ 视频更新成功！')
      
      // 刷新视频列表
      await videoStore.fetchVideos()
      
      // 跳转到视频详情页
      router.push(`/video/${id}`)
    } catch (error) {
      console.error('保存失败:', error)
      message.error(error.message || '保存失败，请重试')
    } finally {
      saving.value = false
    }
  }
  
  // ===== 删除视频 =====
  const handleDelete = () => {
    dialog.warning({
      title: '确认删除',
      content: '确定要删除这个视频吗？删除后无法恢复！',
      positiveText: '确定删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        deleting.value = true
        try {
          const id = video.value.id
          await deleteVideo(id)
          message.success('✅ 视频已删除')
          // 刷新视频列表
          await videoStore.fetchVideos()
          router.push('/')
        } catch (error) {
          console.error('删除失败:', error)
          message.error(error.message || '删除失败，请重试')
        } finally {
          deleting.value = false
        }
      }
    })
  }
  
  // ===== 跳转 =====
  const goBack = () => {
    router.back()
  }
  
  const goHome = () => {
    router.push('/')
  }
  
  // ===== 组件挂载 =====
  onMounted(() => {
    loadVideo()
  })
  </script>
  
  <style scoped>
  .video-edit-container {
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
  
  .edit-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px 28px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
  
  /* ===== 封面图 ===== */
  .cover-section {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .cover-preview {
    flex-shrink: 0;
  }
  
  .cover-image {
    width: 160px;
    height: 90px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e8e8e8;
  }
  
  .cover-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .hidden-input {
    display: none;
  }
  
  .file-name {
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
  
  /* ===== 按钮 ===== */
  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
  
  /* ===== 加载状态 ===== */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: 16px;
    color: #999;
  }
  
  .empty-state {
    text-align: center;
    padding: 60px 0;
  }
  
  /* ===== 响应式 ===== */
  @media (max-width: 768px) {
    .video-edit-container {
      padding: 12px;
    }
  
    .edit-card {
      padding: 16px;
    }
  
    .cover-section {
      flex-direction: column;
      align-items: flex-start;
    }
  
    .cover-image {
      width: 120px;
      height: 68px;
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