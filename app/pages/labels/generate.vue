<template>
  <div class="flex flex-col gap-4">
    <!-- Header (no-print) -->
    <div class="flex items-start justify-between gap-4 flex-wrap no-print">
      <div class="flex flex-col gap-0.5">
        <NuxtLink to="/labels" class="inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink no-underline mb-1 transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Labels &amp; Barcodes
        </NuxtLink>
        <h2 class="text-base font-semibold text-ink tracking-tight font-khmer">បោះពុម្ពស្លាកទំនិញ &bull; Product Sticker &amp; Label Studio</h2>
        <p class="text-xs text-ink-tertiary mt-0.5">
          Modern Khmer garment stickers (50×30mm, 40×30mm, 60×40mm) with Code-128 barcode &amp; UTF-8 Khmer typography
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <AppButton
          variant="default"
          :loading="generating"
          :disabled="selectedIds.length === 0"
          @click="generateLabelsPdf"
        >
          <template #icon-left>
            <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
          </template>
          <span class="font-khmer">ទាញយក PDF ({{ totalLabels }})</span>
        </AppButton>

        <AppButton
          variant="primary"
          :disabled="selectedIds.length === 0"
          @click="printStickersBrowser"
        >
          <template #icon-left>
            <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
          </template>
          <span class="font-khmer">បោះពុម្ពស្លាកទំនិញ (Print Product Label • {{ totalLabels }})</span>
        </AppButton>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-4 items-start no-print">
      <!-- Left: Variant Selector & Sticker Configuration -->
      <div class="flex flex-col gap-4">
        <!-- Sticker Format Settings -->
        <AppCard title="1. ទំហំស្លាកទំនិញ & ការកំណត់ (Sticker Format & Printer Setup)">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="text-xs font-medium text-ink-secondary font-khmer">ទំហំស្លាកទំនិញ (Label Size Preset)</label>
              <AppSelect
                v-model="settings.paper_size"
                :options="paperPresetOptions"
                @update:model-value="onPresetChange"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-secondary">Sticker Width (mm)</label>
              <input v-model.number="settings.label_width_mm" type="number" min="25" max="100" class="h-9 px-2.5 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors w-full" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-secondary">Sticker Height (mm)</label>
              <input v-model.number="settings.label_height_mm" type="number" min="18" max="80" class="h-9 px-2.5 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors w-full" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-secondary">Barcode Format</label>
              <AppSelect
                v-model="settings.code_type"
                :options="[
                  { label: 'Code-128 Barcode (Standard Retail)', value: 'BARCODE' },
                  { label: 'QR Code (2D)', value: 'QR' },
                ]"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-secondary">Sheet Columns</label>
              <input
                v-model.number="settings.columns"
                type="number"
                :min="1"
                :max="6"
                :disabled="isThermalRollMode"
                class="h-9 px-2.5 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="text-xs font-medium text-ink-secondary font-khmer">ឈ្មោះហាងលើស្លាក (Store Header)</label>
              <input
                v-model="settings.store_name_override"
                type="text"
                placeholder="គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ "
                class="h-9 px-2.5 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors w-full font-khmer"
              />
            </div>

            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="flex items-center gap-2 text-xs text-ink cursor-pointer select-none pt-1">
                <input v-model="settings.show_khr" type="checkbox" class="w-4 h-4 accent-brand-900 cursor-pointer shrink-0" />
                <span>Show Secondary KHR Price (1 USD = 4,100 ៛)</span>
              </label>
            </div>
          </div>
        </AppCard>

        <!-- Variant Selector -->
        <AppCard title="2. ជ្រើសរើសទំនិញ & ចំនួនស្លាក (Select Variants & Quantities)">
          <div class="flex flex-col gap-2 mb-2.5">
            <div class="relative flex items-center">
              <UIcon name="i-heroicons-magnifying-glass" class="absolute left-2.5 text-ink-tertiary pointer-events-none w-4 h-4" />
              <input
                v-model="productSearch"
                type="text"
                placeholder="ស្វែងរកឈ្មោះទំនិញ, SKU, barcode, ពណ៌, ទំហំ..."
                class="w-full h-8.5 pl-8 pr-2.5 text-xs border border-border-default rounded-md bg-surface-card text-ink outline-none focus:border-ink transition-colors font-khmer"
              />
            </div>
            <div class="flex justify-end gap-1.5">
              <AppButton size="sm" variant="ghost" @click="selectAllFiltered">Select Visible</AppButton>
              <AppButton v-if="selectedIds.length > 0" size="sm" variant="ghost" @click="selectedIds = []">
                Clear ({{ selectedIds.length }})
              </AppButton>
            </div>
          </div>

          <div v-if="loadingVariants" class="p-7 text-center text-xs text-ink-tertiary border border-dashed border-border-subtle rounded-md">
            Loading product variants...
          </div>

          <div v-else-if="filteredVariants.length === 0" class="p-7 text-center text-xs text-ink-tertiary border border-dashed border-border-subtle rounded-md">
            No matching product variants found.
          </div>

          <div v-else class="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-0.5">
            <div
              v-for="variant in filteredVariants"
              :key="variant.id"
              class="flex items-center gap-2.5 p-2 sm:px-2.5 border border-border-subtle rounded-md bg-surface-card cursor-pointer hover:bg-surface-hover transition-colors"
              :class="{ '!bg-surface-active !border-border-default': isSelected(variant.id) }"
              @click="toggleVariant(variant.id)"
            >
              <input
                type="checkbox"
                class="w-4 h-4 accent-brand-900 cursor-pointer shrink-0"
                :checked="isSelected(variant.id)"
                @click.stop="toggleVariant(variant.id)"
              />

              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-ink truncate font-khmer">{{ variant.product?.name || variant.sku }}</div>
                <div class="text-[11.5px] text-ink-tertiary truncate font-khmer">
                  <span class="font-mono">{{ variant.sku }}</span>
                  <span v-if="variant.color?.name || variant.size?.name">
                    &bull; {{ [variant.color?.name, variant.size?.name].filter(Boolean).join(' / ') }}
                  </span>
                  <span>&bull; <strong>${{ Number(variant.selling_price).toFixed(2) }}</strong></span>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0" @click.stop>
                <button type="button" class="w-6 h-6 rounded border border-border-default bg-surface-card text-ink-secondary flex items-center justify-center cursor-pointer hover:bg-surface-hover hover:text-ink transition-colors" @click="stepQty(variant.id, -1)">
                  <UIcon name="i-heroicons-minus" class="w-3 h-3" />
                </button>
                <input
                  v-model.number="quantities[variant.id]"
                  type="number"
                  min="1"
                  max="500"
                  class="w-11 h-6 text-center text-xs font-semibold border border-border-default rounded bg-surface-card text-ink focus:outline-hidden"
                />
                <button type="button" class="w-6 h-6 rounded border border-border-default bg-surface-card text-ink-secondary flex items-center justify-center cursor-pointer hover:bg-surface-hover hover:text-ink transition-colors" @click="stepQty(variant.id, 1)">
                  <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Right: Live Sticker Preview -->
      <div class="flex flex-col gap-4">
        <AppCard title="3. មើលស្លាកទំនិញមុនបោះពុម្ព (Live Khmer Sticker Preview)">
          <div class="flex items-center justify-between flex-wrap gap-2 text-xs text-ink-secondary pb-3 mb-3 border-b border-border-subtle">
            <span>
              <strong>{{ selectedIds.length }}</strong> variant(s) &bull;
              <strong>{{ totalLabels }}</strong> total sticker(s) &bull;
              {{ settings.label_width_mm }}×{{ settings.label_height_mm }} mm
            </span>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-bg border border-border-subtle text-ink">
              {{ isThermalRollMode ? 'Thermal Roll (1 per label)' : `${settings.paper_size} Sheet (${settings.columns} cols)` }}
            </span>
          </div>

          <div v-if="expandedPreviewStickers.length === 0" class="flex flex-col items-center justify-center gap-2 py-14 px-5 text-ink-tertiary text-xs text-center">
            <UIcon name="i-heroicons-tag" class="w-8 h-8" />
            <p>Check one or more variants on the left to preview product stickers.</p>
          </div>

          <div v-else class="bg-slate-100 border border-border-subtle rounded-md p-5 max-h-[620px] overflow-auto flex justify-center">
            <div
              :class="isThermalRollMode ? 'flex flex-col items-center gap-3' : 'grid grid-cols-[repeat(auto-fill,var(--sticker-w,50mm))] gap-2.5 justify-center w-full'"
              :style="{
                '--sticker-w': `${settings.label_width_mm}mm`,
                '--sticker-h': `${settings.label_height_mm}mm`,
              }"
            >
              <div
                v-for="(v, idx) in expandedPreviewStickers.slice(0, 40)"
                :key="`${v.id}_${idx}`"
                class="kh-product-sticker"
                :class="`size-${settings.label_width_mm}x${settings.label_height_mm}`"
              >
                <div class="kh-sticker__store">
                  {{ settings.store_name_override.trim() || 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ ' }}
                </div>

                <div class="kh-sticker__product-name">
                  {{ v.product?.name || v.sku }}
                </div>

                <div class="kh-sticker__info-row">
                  <div class="kh-sticker__meta">
                    <div class="kh-sticker__sku-line">
                      SKU: <span class="mono font-bold">{{ v.sku }}</span>
                    </div>
                    <div class="kh-sticker__variant-line">
                      <span>ពណ៌: <strong>{{ v.color?.name || 'ទូទៅ' }}</strong></span>
                      <span class="kh-sticker__var-sep">ទំហំ: <strong>{{ v.size?.name || 'Free' }}</strong></span>
                    </div>
                  </div>

                  <div class="kh-sticker__price-box">
                    <div class="kh-sticker__price-usd">${{ Number(v.selling_price).toFixed(2) }}</div>
                    <div v-if="settings.show_khr" class="kh-sticker__price-khr">{{ formatRiel(Number(v.selling_price)) }}</div>
                  </div>
                </div>

                <div v-if="settings.code_type === 'BARCODE'" class="kh-sticker__barcode-zone">
                  <div class="kh-sticker__barcode-wrap">
                    <img :src="getBarcodeUrl(v.id, 'svg', false)" :alt="v.barcode || v.sku" class="kh-sticker__barcode-img" />
                  </div>
                  <div class="kh-sticker__barcode-text">
                    {{ v.barcode || v.sku }}
                  </div>
                </div>

                <div v-else class="kh-sticker__qr-zone">
                  <img :src="getQrUrl(v.id, 'svg')" :alt="v.sku" class="kh-sticker__qr-img" />
                  <div class="kh-sticker__barcode-text">
                    {{ v.barcode || v.sku }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Dedicated Print-Only Output Area -->
    <div
      id="admin-printable-stickers"
      class="print-only-stickers"
      :class="isThermalRollMode ? 'is-thermal-print' : 'is-sheet-print'"
      :style="{
        '--sticker-w': `${settings.label_width_mm}mm`,
        '--sticker-h': `${settings.label_height_mm}mm`,
        '--sheet-cols': String(settings.columns || 4),
      }"
    >
      <div
        v-for="(v, idx) in expandedPreviewStickers"
        :key="`print_${v.id}_${idx}`"
        class="kh-product-sticker"
        :class="`size-${settings.label_width_mm}x${settings.label_height_mm}`"
      >
        <div class="kh-sticker__store">
          {{ settings.store_name_override.trim() || 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ ' }}
        </div>

        <div class="kh-sticker__product-name">
          {{ v.product?.name || v.sku }}
        </div>

        <div class="kh-sticker__info-row">
          <div class="kh-sticker__meta">
            <div class="kh-sticker__sku-line">
              SKU: <span class="mono font-bold">{{ v.sku }}</span>
            </div>
            <div class="kh-sticker__variant-line">
              <span>ពណ៌: <strong>{{ v.color?.name || 'ទូទៅ' }}</strong></span>
              <span class="kh-sticker__var-sep">ទំហំ: <strong>{{ v.size?.name || 'Free' }}</strong></span>
            </div>
          </div>

          <div class="kh-sticker__price-box">
            <div class="kh-sticker__price-usd">${{ Number(v.selling_price).toFixed(2) }}</div>
            <div v-if="settings.show_khr" class="kh-sticker__price-khr">{{ formatRiel(Number(v.selling_price)) }}</div>
          </div>
        </div>

        <div v-if="settings.code_type === 'BARCODE'" class="kh-sticker__barcode-zone">
          <div class="kh-sticker__barcode-wrap">
            <img :src="getBarcodeUrl(v.id, 'svg', false)" :alt="v.barcode || v.sku" class="kh-sticker__barcode-img" />
          </div>
          <div class="kh-sticker__barcode-text">
            {{ v.barcode || v.sku }}
          </div>
        </div>

        <div v-else class="kh-sticker__qr-zone">
          <img :src="getQrUrl(v.id, 'svg')" :alt="v.sku" class="kh-sticker__qr-img" />
          <div class="kh-sticker__barcode-text">
            {{ v.barcode || v.sku }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductVariant } from '~/types'
import { printWithKhmerFonts } from '~/composables/useKhmerPrint'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Generate Product Stickers — Clothing Store' })

const route = useRoute()
const { listVariants, getQrUrl, getBarcodeUrl } = useVariantApi()
const { generateLabels } = useLabelApi()
const { addToast } = useAppToast()

const productSearch = ref('')
const allVariants = ref<ProductVariant[]>([])
const selectedIds = ref<string[]>([])
const quantities = reactive<Record<string, number>>({})
const loadingVariants = ref(true)
const generating = ref(false)

const paperPresetOptions = [
  { label: 'Thermal Sticker Roll — 50 × 30 mm (Default)', value: 'THERMAL_50x30' },
  { label: 'Thermal Sticker Roll — 40 × 30 mm (Compact)', value: 'THERMAL_40x30' },
  { label: 'Thermal Sticker Roll — 60 × 40 mm (Large)', value: 'THERMAL_60x40' },
  { label: 'A4 Sticker Sheet (Grid — 4 Columns • 50 × 30 mm)', value: 'A4' },
  { label: 'A5 Sticker Sheet (Grid — 3 Columns)', value: 'A5' },
]

const settings = reactive({
  paper_size: 'THERMAL_50x30',
  label_width_mm: 50,
  label_height_mm: 30,
  columns: 1,
  code_type: 'BARCODE',
  show_khr: false,
  store_name_override: 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ ',
})

const isThermalRollMode = computed(() =>
  ['THERMAL_50x30', 'THERMAL_40x30', 'THERMAL_60x40', 'CUSTOM_58mm', 'CUSTOM_80mm'].includes(settings.paper_size) || settings.columns === 1,
)

function onPresetChange(preset: string) {
  if (preset === 'THERMAL_50x30') {
    settings.label_width_mm = 50
    settings.label_height_mm = 30
    settings.columns = 1
  } else if (preset === 'THERMAL_40x30') {
    settings.label_width_mm = 40
    settings.label_height_mm = 30
    settings.columns = 1
  } else if (preset === 'THERMAL_60x40') {
    settings.label_width_mm = 60
    settings.label_height_mm = 40
    settings.columns = 1
  } else if (preset === 'A4') {
    settings.label_width_mm = 48
    settings.label_height_mm = 30
    settings.columns = 4
  } else if (preset === 'A5') {
    settings.label_width_mm = 45
    settings.label_height_mm = 28
    settings.columns = 3
  }
}

const filteredVariants = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) return allVariants.value
  return allVariants.value.filter(
    (v) =>
      v.product?.name?.toLowerCase().includes(q) ||
      v.sku?.toLowerCase().includes(q) ||
      v.barcode?.toLowerCase().includes(q) ||
      v.color?.name?.toLowerCase().includes(q) ||
      v.size?.name?.toLowerCase().includes(q),
  )
})

const totalLabels = computed(() =>
  selectedIds.value.reduce((sum, id) => sum + Math.max(1, quantities[id] || 1), 0),
)

const expandedPreviewStickers = computed(() => {
  const list: ProductVariant[] = []
  const map = new Map(allVariants.value.map((v) => [v.id, v]))
  for (const id of selectedIds.value) {
    const v = map.get(id)
    if (!v) continue
    const count = Math.min(500, Math.max(1, quantities[id] || 1))
    for (let i = 0; i < count; i++) {
      list.push(v)
    }
  }
  return list
})

function isSelected(id: string): boolean {
  return selectedIds.value.includes(id)
}

function toggleVariant(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
    if (!quantities[id] || quantities[id] < 1) quantities[id] = 1
  }
}

function stepQty(id: string, delta: number) {
  const next = Math.max(1, Math.min(500, (quantities[id] || 1) + delta))
  quantities[id] = next
  if (!isSelected(id)) {
    selectedIds.value.push(id)
  }
}

function selectAllFiltered() {
  const ids = new Set(selectedIds.value)
  for (const v of filteredVariants.value) {
    ids.add(v.id)
    if (!quantities[v.id]) quantities[v.id] = 1
  }
  selectedIds.value = Array.from(ids)
}

function formatRiel(usd: number): string {
  return `${Math.round(usd * 4100).toLocaleString()} ៛`
}

onMounted(async () => {
  const qPreset = typeof route.query.preset === 'string' ? route.query.preset : ''
  if (qPreset) {
    settings.paper_size = qPreset
    onPresetChange(qPreset)
  }

  try {
    const variants = (await listVariants({ limit: 300 })) as ProductVariant[]
    allVariants.value = variants || []
    for (const v of allVariants.value) {
      quantities[v.id] = 1
    }

    const qVariantId = typeof route.query.variant_id === 'string' ? route.query.variant_id : ''
    const qProductId = typeof route.query.product_id === 'string' ? route.query.product_id : ''
    if (qVariantId && allVariants.value.some((v) => v.id === qVariantId)) {
      selectedIds.value = [qVariantId]
    } else if (qProductId) {
      selectedIds.value = allVariants.value.filter((v) => v.product_id === qProductId).map((v) => v.id)
    } else if (allVariants.value.length > 0) {
      selectedIds.value = [allVariants.value[0]!.id]
    }
  } catch (err: any) {
    addToast({ type: 'error', title: 'Failed to load variants', message: err?.message || String(err) })
  } finally {
    loadingVariants.value = false
  }
})

async function printStickersBrowser() {
  await printWithKhmerFonts()
}

async function generateLabelsPdf() {
  if (selectedIds.value.length === 0) return
  generating.value = true
  try {
    const body = {
      variants: selectedIds.value.map((id) => ({
        variant_id: id,
        quantity: Math.max(1, quantities[id] || 1),
      })),
      paper_size: settings.paper_size,
      label_width_mm: settings.label_width_mm,
      label_height_mm: settings.label_height_mm,
      columns: settings.columns,
      code_type: settings.code_type,
      show_khr: settings.show_khr,
      store_name_override: settings.store_name_override.trim() || null,
    }

    const blob = await generateLabels(body)
    const url = URL.createObjectURL(blob as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `khmer-product-labels-${Date.now()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'PDF Generated', message: `${totalLabels.value} product sticker(s) downloaded` })
  } catch (err: any) {
    console.error(err)
    addToast({ type: 'error', title: 'Failed to generate labels PDF', message: err?.message || 'Please try again' })
  } finally {
    generating.value = false
  }
}
</script>

