<template>
  <div class="app-file-upload">
    <label v-if="label" class="app-file-upload__label">
      {{ label }}
      <span v-if="required" class="app-file-upload__required">*</span>
    </label>

    <!-- Preview if file already uploaded / provided -->
    <div v-if="modelValue" class="app-file-upload__preview">
      <div class="app-file-upload__thumb-wrap">
        <img
          v-if="isImage(modelValue)"
          :src="modelValue"
          alt="Attachment preview"
          class="app-file-upload__thumb"
        />
        <div v-else class="app-file-upload__doc-icon">
          <UIcon name="i-heroicons-document-text" class="w-6 h-6" />
        </div>
      </div>

      <div class="app-file-upload__meta">
        <a :href="modelValue" target="_blank" rel="noopener noreferrer" class="app-file-upload__filename" :title="modelValue">
          {{ getDisplayFilename(modelValue) }}
        </a>
        <span class="app-file-upload__tag">Uploaded</span>
      </div>

      <button
        type="button"
        class="app-file-upload__remove-btn"
        title="Remove attachment"
        @click="clearFile"
      >
        <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Dropzone when no file selected -->
    <div
      v-else
      class="app-file-upload__dropzone"
      :class="{
        'is-dragging': isDragging,
        'is-uploading': isUploading,
        'is-error': !!uploadError,
      }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInputRef"
        type="file"
        :accept="accept"
        class="app-file-upload__input"
        @change="handleFileChange"
      />

      <!-- Uploading spinner / progress -->
      <div v-if="isUploading" class="app-file-upload__progress-wrap">
        <div class="app-file-upload__spinner" />
        <span class="app-file-upload__progress-text">Uploading attachment... {{ uploadProgress }}%</span>
        <div class="app-file-upload__bar">
          <div class="app-file-upload__bar-fill" :style="{ width: `${uploadProgress}%` }" />
        </div>
      </div>

      <!-- Idle prompt -->
      <div v-else class="app-file-upload__prompt">
        <div class="app-file-upload__icon-box">
          <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5" />
        </div>
        <div class="app-file-upload__text-group">
          <span class="app-file-upload__main-text">
            <strong style="color:var(--text-primary); font-weight:600;">Click to upload</strong> or drag and drop
          </span>
          <span class="app-file-upload__sub-text">{{ hint || 'PNG, JPG, WEBP, or PDF up to 10MB' }}</span>
        </div>
      </div>
    </div>

    <div v-if="uploadError" class="app-file-upload__error">
      {{ uploadError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUpload } from '~/composables/useUpload'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    hint?: string
    folder?: string
    accept?: string
    required?: boolean
  }>(),
  {
    modelValue: '',
    label: '',
    hint: '',
    folder: 'attachments',
    accept: 'image/*,application/pdf',
    required: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'uploaded', value: any): void
}>()

const { uploadFile, isUploading, uploadProgress, error: uploadError } = useUpload()
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  if (!isUploading.value) {
    fileInputRef.value?.click()
  }
}

async function handleFile(file: File) {
  const result = await uploadFile(file, props.folder)
  if (result && result.url) {
    emit('update:modelValue', result.url)
    emit('uploaded', result)
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    handleFile(input.files[0])
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    handleFile(event.dataTransfer.files[0])
  }
}

function clearFile() {
  emit('update:modelValue', '')
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url)
}

function getDisplayFilename(url: string) {
  try {
    const parts = url.split('/')
    return decodeURIComponent(parts[parts.length - 1] ?? url)
  } catch {
    return url
  }
}
</script>

<style scoped>
.app-file-upload {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.app-file-upload__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-file-upload__required {
  color: #ef4444;
}

.app-file-upload__dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 20px;
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
  min-height: 90px;
  position: relative;
}

.app-file-upload__dropzone:hover {
  border-color: var(--text-secondary);
  background: var(--surface-hover);
}

.app-file-upload__dropzone.is-dragging {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.04);
}

.app-file-upload__dropzone.is-error {
  border-color: #ef4444;
}

.app-file-upload__input {
  display: none;
}

.app-file-upload__prompt {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-file-upload__icon-box {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: var(--surface-active);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-file-upload__text-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-file-upload__main-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.app-file-upload__sub-text {
  font-size: 11px;
  color: var(--text-tertiary);
}

.app-file-upload__progress-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 240px;
}

.app-file-upload__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.app-file-upload__progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.app-file-upload__bar {
  width: 100%;
  height: 4px;
  background: var(--surface-active);
  border-radius: 2px;
  overflow: hidden;
}

.app-file-upload__bar-fill {
  height: 100%;
  background: #2563eb;
  transition: width 0.2s ease;
}

/* Preview state */
.app-file-upload__preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.app-file-upload__thumb-wrap {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--surface-active);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-file-upload__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-file-upload__doc-icon {
  color: var(--text-secondary);
}

.app-file-upload__meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-file-upload__filename {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-file-upload__filename:hover {
  text-decoration: underline;
}

.app-file-upload__tag {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-tertiary);
}

.app-file-upload__remove-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.app-file-upload__remove-btn:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: #ef4444;
  color: #ef4444;
}

.app-file-upload__error {
  font-size: 12px;
  color: #ef4444;
}
</style>
