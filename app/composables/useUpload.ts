export interface UploadedAttachment {
  id: string
  filename: string
  object_name: string
  url: string
  content_type: string
  size: number
  bucket: string
  created_at: string
}

export function useUpload() {
  const { apiFetch } = useApi()
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const error = ref<string | null>(null)

  async function uploadFile(file: File, folder = 'attachments'): Promise<UploadedAttachment | null> {
    isUploading.value = true
    uploadProgress.value = 10
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      uploadProgress.value = 40
      const data = await apiFetch<UploadedAttachment>('/api/admin/v1/attachments/upload', {
        method: 'POST',
        body: formData,
      })

      uploadProgress.value = 100
      return data
    } catch (err: any) {
      error.value = err?.data?.detail || err?.message || 'File upload failed'
      return null
    } finally {
      isUploading.value = false
      setTimeout(() => {
        uploadProgress.value = 0
      }, 800)
    }
  }

  return {
    uploadFile,
    isUploading,
    uploadProgress,
    error,
  }
}
