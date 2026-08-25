<template>
    <n-modal
      v-model:show="visible"
      preset="card"
      :title="isLoginMode ? '登录' : '注册'"
      class="login-modal"
      :style="{ width: '420px' }"
      @close="handleClose"
    >
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="top"
      >
        <!-- 用户名 -->
        <n-form-item label="用户名" path="username">
          <n-input
            v-model:value="formData.username"
            placeholder="请输入用户名"
            size="large"
          />
        </n-form-item>
  
        <!-- 密码 -->
        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formData.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password-on="click"
          />
        </n-form-item>
  
        <!-- 邮箱（仅注册时显示） -->
        <n-form-item v-if="!isLoginMode" label="邮箱" path="email">
          <n-input
            v-model:value="formData.email"
            placeholder="请输入邮箱地址"
            size="large"
          />
        </n-form-item>
  
        <!-- 提交按钮 -->
        <n-form-item>
          <n-button
            type="primary"
            size="large"
            block
            :loading="loading"
            @click="handleSubmit"
          >
            {{ isLoginMode ? '登录' : '注册' }}
          </n-button>
        </n-form-item>
  
        <!-- 切换模式 -->
        <div class="switch-mode">
          <span>{{ isLoginMode ? '还没有账号？' : '已有账号？' }}</span>
          <n-button text type="primary" @click="toggleMode">
            {{ isLoginMode ? '立即注册' : '立即登录' }}
          </n-button>
        </div>
      </n-form>
  
      <!-- 错误提示 -->
      <n-alert v-if="errorMessage" type="error" closable @close="errorMessage = ''">
        {{ errorMessage }}
      </n-alert>
    </n-modal>
  </template>
  
  <script setup>
  import { ref, reactive, watch } from 'vue'
  import {
    NModal,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NAlert
  } from 'naive-ui'
  import { useUserStore } from '@/stores/user'
  
  // Props
  const props = defineProps({
    show: {
      type: Boolean,
      default: false
    }
  })
  
  // Emits
  const emit = defineEmits(['update:show', 'success'])
  
  // Store
  const userStore = useUserStore()
  
  // 状态
  const visible = ref(props.show)
  const isLoginMode = ref(true)
  const loading = ref(false)
  const errorMessage = ref('')
  const formRef = ref(null)
  
  // 表单数据
  const formData = reactive({
    username: '',
    password: '',
    email: ''
  })
  
  // 表单验证规则
  const rules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' }
    ],
    email: [
      { 
        required: false, 
        validator: (rule, value) => {
          if (!value) return true
          return value.includes('@')
        },
        message: '请输入有效的邮箱地址', 
        trigger: 'blur'
      }
    ]
  }
  
  // 监听 props.show 变化
  watch(() => props.show, (newVal) => {
    visible.value = newVal
    if (!newVal) {
      resetForm()
    }
  })
  
  // 监听 visible 变化
  watch(visible, (newVal) => {
    emit('update:show', newVal)
    if (!newVal) {
      resetForm()
    }
  })
  
  // 切换登录/注册模式
  const toggleMode = () => {
    isLoginMode.value = !isLoginMode.value
    errorMessage.value = ''
    resetForm()
  }
  
  // 重置表单
  const resetForm = () => {
    formData.username = ''
    formData.password = ''
    formData.email = ''
    errorMessage.value = ''
    formRef.value?.restoreValidation()
  }
  
  // 关闭弹窗
  const handleClose = () => {
    visible.value = false
  }
  
  // 提交表单
  const handleSubmit = async () => {
    // 验证表单
    try {
      await formRef.value?.validate()
    } catch (e) {
      return
    }
  
    loading.value = true
    errorMessage.value = ''
  
    try {
      if (isLoginMode.value) {
        // 登录
        const result = await userStore.login(
          formData.username,
          formData.password
        )
        emit('success', result)
        visible.value = false
      } else {
        // 注册
        await userStore.register(
          formData.username,
          formData.password,
          formData.email
        )
        // 注册成功后自动登录
        const result = await userStore.login(
          formData.username,
          formData.password
        )
        emit('success', result)
        visible.value = false
      }
    } catch (err) {
      errorMessage.value = err.message || '操作失败，请重试'
    } finally {
      loading.value = false
    }
  }
  </script>
  
  <style scoped>
  .login-modal :deep(.n-card-header) {
    font-size: 20px;
    font-weight: 600;
    justify-content: center;
  }
  
  .switch-mode {
    text-align: center;
    color: #999;
    font-size: 14px;
    margin-top: 8px;
  }
  
  .switch-mode .n-button {
    font-size: 14px;
  }
  </style>