<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label v-if="label" class="text-xs font-medium text-ink-secondary">
      {{ label }}
      <span v-if="required" class="text-status-red">*</span>
    </label>

    <!-- Preview if file already uploaded / provided -->
    <div v-if="modelValue" class="flex items-center gap-3 p-2.5 bg-surface-card border border-border-subtle rounded-md">
      <div class="w-10 h-10 rounded bg-surface-hover border border-border-subtle overflow-hidden flex items-center justify-center shrink-0">
        <img
          v-if="isImage(modelValue)"
          :src="modelValue"
          alt="Attachment preview"
          class="w-full h-full object-cover"
        />
        <div v-else class="text-ink-secondary flex items-center justify-center">
          <UIcon name="i-heroicons-document-text" class="w-6 h-6" />
        </div>
      </div>

      <div class="flex-1 min-w-0 flex flex-col gap-0.5">
        <a :href="modelValue" target="_blank" rel="noopener noreferrer" class="text-xs font-medium text-ink hover:underline truncate max-w-full" :title="modelValue">
          {{ getDisplayFilename(modelValue) }}
        </a>
        <span class="inline-flex text-[10px] font-semibold text-status-green bg-status-green-bg px-1.5 py-0.5 rounded w-fit">Uploaded</span>
      </div>

      <button
        type="button"
        class="w-7 h-7 rounded flex items-center justify-center text-ink-tertiary hover:text-status-red hover:bg-surface-hover cursor-pointer transition-colors border-none bg-transparent"
        title="Remove attachment"
        @click="clearFile"
      >
        <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Dropzone when no file selected -->
    <div
      v-else
      class="flex flex-col items-center justify-center p-5 bg-surface-card border border-dashed border-border-default rounded-md cursor-pointer hover:bg-surface-hover transition-colors text-center"
      :class="{
        '!bg-surface-hover !border-ink': isDragging,
        'cursor-wait opacity-80 pointer-events-none': isUploading,
        '!border-status-red bg-status-red-bg/10': !!uploadError,
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
        class="hidden"
        @change="handleFileChange"
      />

      <!-- Uploading spinner / progress -->
      <div v-if="isUploading" class="flex flex-col items-center gap-2 w-full max-w-[240px]">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-ink animate-spin" />
        <span class="text-xs text-ink-secondary">Uploading attachment... {{ uploadProgress }}%</span>
        <div class="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden border border-border-subtle">
          <div class="h-full bg-brand-900 transition-all duration-150" :style="{ width: `${uploadProgress}%` }" />
        </div>
      </div>

      <!-- Idle prompt -->
      <div v-else class="flex flex-col items-center text-center">
        <div class="w-9 h-9 rounded-full bg-surface-hover border border-border-subtle flex items-center justify-center text-ink-secondary mb-2">
          <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5" />
        </div>
        <div class="flex flex-col items-center">
          <span class="text-xs text-ink-secondary">
            <strong class="text-ink font-semibold">Click to upload</strong> or drag and drop
          </span>
          <span class="text-[11px] text-ink-tertiary mt-0.5">{{ hint || 'PNG, JPG, WEBP, or PDF up to 10MB' }}</span>
        </div>
      </div>
    </div>

    <div v-if="uploadError" class="text-xs text-status-red mt-1">
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
