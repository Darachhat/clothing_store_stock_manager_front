<template>
  <div class="page-root">
    <!-- Header (no-print) -->
    <div class="page-header no-print">
      <div class="page-header__left">
        <NuxtLink to="/labels" class="back-link">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Labels &amp; Barcodes
        </NuxtLink>
        <h2 class="page-title kh-text">បោះពុម្ពស្លាកទំនិញ &bull; Product Sticker &amp; Label Studio</h2>
        <p class="page-subtitle">
          Modern Khmer garment stickers (50×30mm, 40×30mm, 60×40mm) with Code-128 barcode &amp; UTF-8 Khmer typography
        </p>
      </div>

      <div class="page-header__actions">
        <AppButton
          variant="default"
          :loading="generating"
          :disabled="selectedIds.length === 0"
          @click="generateLabelsPdf"
        >
          <template #icon-left>
            <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
          </template>
          <span class="kh-text">ទាញយក PDF ({{ totalLabels }})</span>
        </AppButton>

        <AppButton
          variant="primary"
          :disabled="selectedIds.length === 0"
          @click="printStickersBrowser"
        >
          <template #icon-left>
            <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
          </template>
          <span class="kh-text">បោះពុម្ពស្លាកទំនិញ (Print Product Label • {{ totalLabels }})</span>
        </AppButton>
      </div>
    </div>

    <div class="studio-grid no-print">
      <!-- Left: Variant Selector & Sticker Configuration -->
      <div class="studio-left">
        <!-- Sticker Format Settings -->
        <AppCard title="1. ទំហំស្លាកទំនិញ & ការកំណត់ (Sticker Format & Printer Setup)">
          <div class="settings-grid">
            <div class="form-field col-span-2">
              <label class="field-label kh-text">ទំហំស្លាកទំនិញ (Label Size Preset)</label>
              <AppSelect
                v-model="settings.paper_size"
                :options="paperPresetOptions"
                @update:model-value="onPresetChange"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Sticker Width (mm)</label>
              <input v-model.number="settings.label_width_mm" type="number" min="25" max="100" class="field-input" />
            </div>

            <div class="form-field">
              <label class="field-label">Sticker Height (mm)</label>
              <input v-model.number="settings.label_height_mm" type="number" min="18" max="80" class="field-input" />
            </div>

            <div class="form-field">
              <label class="field-label">Barcode Format</label>
              <AppSelect
                v-model="settings.code_type"
                :options="[
                  { label: 'Code-128 Barcode (Standard Retail)', value: 'BARCODE' },
                  { label: 'QR Code (2D)', value: 'QR' },
                ]"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Sheet Columns</label>
              <input
                v-model.number="settings.columns"
                type="number"
                :min="1"
                :max="6"
                :disabled="isThermalRollMode"
                class="field-input"
              />
            </div>

            <div class="form-field col-span-2">
              <label class="field-label kh-text">ឈ្មោះហាងលើស្លាក (Store Header)</label>
              <input
                v-model="settings.store_name_override"
                type="text"
                placeholder="គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ "
                class="field-input kh-text"
              />
            </div>

            <div class="form-field col-span-2">
              <label class="checkbox-row">
                <input v-model="settings.show_khr" type="checkbox" class="native-checkbox" />
                <span>Show Secondary KHR Price (1 USD = 4,100 ៛)</span>
              </label>
            </div>
          </div>
        </AppCard>

        <!-- Variant Selector -->
        <AppCard title="2. ជ្រើសរើសទំនិញ & ចំនួនស្លាក (Select Variants & Quantities)">
          <div class="selector-toolbar">
            <div class="search-wrap">
              <UIcon name="i-heroicons-magnifying-glass" class="search-icon w-4 h-4" />
              <input
                v-model="productSearch"
                type="text"
                placeholder="ស្វែងរកឈ្មោះទំនិញ, SKU, barcode, ពណ៌, ទំហំ..."
                class="search-input kh-text"
              />
            </div>
            <div class="toolbar-btns">
              <AppButton size="sm" variant="ghost" @click="selectAllFiltered">Select Visible</AppButton>
              <AppButton v-if="selectedIds.length > 0" size="sm" variant="ghost" @click="selectedIds = []">
                Clear ({{ selectedIds.length }})
              </AppButton>
            </div>
          </div>

          <div v-if="loadingVariants" class="empty-box">
            Loading product variants...
          </div>

          <div v-else-if="filteredVariants.length === 0" class="empty-box">
            No matching product variants found.
          </div>

          <div v-else class="variant-list">
            <div
              v-for="variant in filteredVariants"
              :key="variant.id"
              class="variant-item"
              :class="{ 'is-selected': isSelected(variant.id) }"
              @click="toggleVariant(variant.id)"
            >
              <input
                type="checkbox"
                class="native-checkbox"
                :checked="isSelected(variant.id)"
                @click.stop="toggleVariant(variant.id)"
              />

              <div class="variant-info">
                <div class="variant-name kh-text">{{ variant.product?.name || variant.sku }}</div>
                <div class="variant-meta kh-text">
                  <span class="mono">{{ variant.sku }}</span>
                  <span v-if="variant.color?.name || variant.size?.name">
                    &bull; {{ [variant.color?.name, variant.size?.name].filter(Boolean).join(' / ') }}
                  </span>
                  <span>&bull; <strong>${{ Number(variant.selling_price).toFixed(2) }}</strong></span>
                </div>
              </div>

              <div class="qty-control" @click.stop>
                <button type="button" class="qty-btn" @click="stepQty(variant.id, -1)">
                  <UIcon name="i-heroicons-minus" class="w-3 h-3" />
                </button>
                <input
                  v-model.number="quantities[variant.id]"
                  type="number"
                  min="1"
                  max="500"
                  class="qty-input"
                />
                <button type="button" class="qty-btn" @click="stepQty(variant.id, 1)">
                  <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Right: Live Sticker Preview -->
      <div class="studio-right">
        <AppCard title="3. មើលស្លាកទំនិញមុនបោះពុម្ព (Live Khmer Sticker Preview)">
          <div class="preview-summary">
            <span>
              <strong>{{ selectedIds.length }}</strong> variant(s) &bull;
              <strong>{{ totalLabels }}</strong> total sticker(s) &bull;
              {{ settings.label_width_mm }}×{{ settings.label_height_mm }} mm
            </span>
            <span class="preview-mode-tag">
              {{ isThermalRollMode ? 'Thermal Roll (1 per label)' : `${settings.paper_size} Sheet (${settings.columns} cols)` }}
            </span>
          </div>

          <div v-if="expandedPreviewStickers.length === 0" class="preview-empty">
            <UIcon name="i-heroicons-tag" class="w-8 h-8" />
            <p>Check one or more variants on the left to preview product stickers.</p>
          </div>

          <div v-else class="preview-stage">
            <div
              class="preview-grid"
              :class="isThermalRollMode ? 'is-thermal' : 'is-sheet'"
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

<style scoped>
.kh-text {
  font-family: 'Kantumruy Pro', 'Battambang', 'Battambang Local', 'Noto Sans Khmer', sans-serif;
}

.page-root { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-header__left { display: flex; flex-direction: column; gap: 2px; }
.page-header__actions { display: flex; gap: 8px; align-items: center; }

.back-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--text-tertiary); text-decoration: none; margin-bottom: 4px;
}
.back-link:hover { color: var(--text-primary); }
.page-title { font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
.page-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }

.studio-grid { display: grid; grid-template-columns: 440px 1fr; gap: 16px; align-items: start; }
@media (max-width: 1024px) { .studio-grid { grid-template-columns: 1fr; } }
.studio-left, .studio-right { display: flex; flex-direction: column; gap: 16px; }

.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.col-span-2 { grid-column: span 2; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.field-input {
  height: 36px; padding: 0 10px; font-size: 13px; background: var(--surface-card);
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box;
}
.field-input:focus { border-color: var(--border-strong); }
.field-input:disabled { opacity: 0.5; cursor: not-allowed; }

.checkbox-row {
  display: flex; align-items: center; gap: 8px; font-size: 12.5px;
  color: var(--text-primary); cursor: pointer; user-select: none; padding-top: 4px;
}
.native-checkbox { width: 15px; height: 15px; accent-color: #111827; cursor: pointer; flex-shrink: 0; }

.selector-toolbar { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.search-wrap { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 10px; color: var(--text-tertiary); pointer-events: none; }
.search-input {
  width: 100%; height: 34px; padding: 0 10px 0 32px; font-size: 12.5px;
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--surface-card); color: var(--text-primary); outline: none;
}
.toolbar-btns { display: flex; justify-content: flex-end; gap: 6px; }

.empty-box {
  padding: 28px; text-align: center; font-size: 12.5px; color: var(--text-tertiary);
  border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);
}

.variant-list {
  display: flex; flex-direction: column; gap: 6px;
  max-height: 420px; overflow-y: auto; padding-right: 2px;
}
.variant-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  background: var(--surface-card); cursor: pointer; transition: background 0.12s;
}
.variant-item:hover { background: var(--surface-hover); }
.variant-item.is-selected { background: var(--surface-inset); border-color: var(--border-strong); }

.variant-info { flex: 1; min-width: 0; }
.variant-name { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.variant-meta { font-size: 11.5px; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mono { font-family: monospace; }

.qty-control { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.qty-btn {
  width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--border-default);
  background: var(--surface-card); color: var(--text-secondary);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.qty-btn:hover { background: var(--surface-hover); color: var(--text-primary); }
.qty-input {
  width: 44px; height: 24px; text-align: center; font-size: 12px; font-weight: 600;
  border: 1px solid var(--border-default); border-radius: 4px; background: var(--surface-card); color: var(--text-primary);
}

.preview-summary {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  font-size: 12px; color: var(--text-secondary); padding-bottom: 12px; margin-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}
.preview-mode-tag {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
  background: var(--surface-inset); border: 1px solid var(--border-subtle); color: var(--text-primary);
}
.preview-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 56px 20px; color: var(--text-tertiary); font-size: 12.5px; text-align: center;
}
.preview-stage {
  background: #f1f5f9; border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  padding: 20px; max-height: 620px; overflow: auto; display: flex; justify-content: center;
}
.preview-grid.is-thermal { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.preview-grid.is-sheet {
  display: grid; grid-template-columns: repeat(auto-fill, var(--sticker-w, 50mm));
  gap: 10px; justify-content: center; width: 100%;
}

.print-only-stickers { display: none; }
</style>

<style>
/* Template C: Modern Khmer Product Sticker Styles */
.kh-product-sticker {
  width: var(--sticker-w, 50mm);
  height: var(--sticker-h, 30mm);
  background: #ffffff;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  padding: 1.6mm 2.2mm 1.4mm;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-family: 'Kantumruy Pro', 'Battambang', 'Battambang Local', 'Noto Sans Khmer', sans-serif;
  overflow: hidden;
  page-break-inside: avoid;
  break-inside: avoid;
}
.kh-sticker__store {
  font-size: 5.5pt;
  font-weight: 700;
  color: #374151;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kh-sticker__product-name {
  font-size: 7.5pt;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 0.4pt solid #e5e7eb;
  padding-bottom: 0.4mm;
}
.kh-sticker__info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5mm;
  padding-top: 0.3mm;
}
.kh-sticker__meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2mm;
}
.kh-sticker__sku-line {
  font-size: 5.5pt;
  color: #374151;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kh-sticker__variant-line {
  font-size: 5.8pt;
  color: #111827;
  line-height: 1.25;
  display: flex;
  align-items: center;
  gap: 2mm;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kh-sticker__var-sep { margin-left: 0.5mm; }
.kh-sticker__price-box { flex-shrink: 0; text-align: right; line-height: 1; }
.kh-sticker__price-usd {
  font-size: 9.5pt;
  font-weight: 800;
  color: #111827;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.kh-sticker__price-khr {
  font-size: 5.2pt;
  font-weight: 600;
  color: #4b5563;
  margin-top: 0.3mm;
}
.kh-sticker__barcode-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-top: 0.3mm;
  min-height: 0;
}
.kh-sticker__barcode-wrap {
  width: 100%;
  padding: 0 2mm;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
}
.kh-sticker__barcode-img {
  width: 100%;
  height: 7.8mm;
  object-fit: contain;
  display: block;
}
.kh-product-sticker.size-60x40 .kh-sticker__barcode-img { height: 11.5mm; }
.kh-product-sticker.size-60x40 .kh-sticker__product-name { font-size: 9pt; }
.kh-product-sticker.size-60x40 .kh-sticker__price-usd { font-size: 11.5pt; }
.kh-sticker__barcode-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 5.5pt;
  font-weight: 700;
  color: #111827;
  text-align: center;
  letter-spacing: 0.04em;
  line-height: 1.1;
  margin-top: 0.2mm;
}
.kh-sticker__qr-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2mm;
  padding-top: 0.3mm;
}
.kh-sticker__qr-img {
  width: 9.5mm;
  height: 9.5mm;
  object-fit: contain;
}

@media print {
  @page {
    margin: 0;
  }

  html,
  body {
    height: auto !important;
    overflow: visible !important;
    background: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .no-print {
    display: none !important;
  }

  #admin-printable-stickers.print-only-stickers {
    display: block !important;
  }

  #admin-printable-stickers.is-thermal-print .kh-product-sticker {
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    page-break-after: always !important;
    break-after: page !important;
  }

  #admin-printable-stickers.is-sheet-print {
    display: grid !important;
    grid-template-columns: repeat(var(--sheet-cols, 4), var(--sticker-w, 50mm)) !important;
    gap: 3mm !important;
    padding: 8mm !important;
    justify-content: start !important;
  }
}
</style>
