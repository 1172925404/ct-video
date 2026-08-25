// src/utils/upload.js

// 压缩图片（限制最大尺寸和文件大小）
export const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target.result
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
  
          // 按比例缩放
          if (width > maxWidth) {
            height = height * maxWidth / width
            width = maxWidth
          }
          if (height > maxHeight) {
            width = width * maxHeight / height
            height = maxHeight
          }
  
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
  
          // 转换为 base64
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(dataUrl)
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }
  
  // 上传图片到免费图床（使用 ImgBB API）
  export const uploadImage = async (file) => {
    try {
      // 先压缩
      const compressed = await compressImage(file, 800, 800, 0.7)
      
      // 使用 ImgBB 免费图床 API（需要注册获取 API key）
      // 注册地址：https://api.imgbb.com/
      // 这里使用一个公开的测试 key，建议用户自己注册替换
      const API_KEY = '你的ImgBB_API_KEY' // 用户需要自己注册替换
      
      const formData = new FormData()
      formData.append('key', API_KEY)
      formData.append('image', compressed.split(',')[1]) // 去掉 base64 前缀
      
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      if (result.success) {
        return result.data.url
      } else {
        throw new Error(result.error?.message || '上传失败')
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      throw error
    }
  }
  
  // 使用 base64 存储（备选方案，不需要 API key）
  export const uploadImageBase64 = async (file) => {
    return await compressImage(file, 600, 600, 0.6)
  }