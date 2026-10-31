<template>
  <div class="page-root">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header__left">
        <NuxtLink :to="`/products/${id}`" class="back-link">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          {{ product?.name ?? 'Product' }}
        </NuxtLink>
        <h2 class="page-title">Product Variants</h2>
        <p class="page-subtitle">Manage sizes, colors, SKUs, barcodes, and Khmer garment stickers</p>
      </div>
      <div class="page-header__actions">
        <AppButton variant="default" :to="`/labels/generate?product_id=${id}`">
          <template #icon-left>
            <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
          </template>
          <span class="kh-text">បោះពុម្ពស្លាកទំនិញ (Print Product Label)</span>
        </AppButton>
        <AppButton variant="primary" @click="openCreate">
          <template #icon-left>
            <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
          </template>
          Add Variant
        </AppButton>
      </div>
    </div>

    <!-- Variants Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="variants"
        :loading="loading"
        empty-text="No variants yet. Add your first variant."
      >
        <template #cell-color="{ row }">
          <div class="color-cell">
            <span v-if="row.color?.hex_code" class="color-dot" :style="{ background: row.color.hex_code }" />
            {{ row.color?.name ?? '—' }}
          </div>
        </template>
        <template #cell-size="{ row }">{{ row.size?.name ?? '—' }}</template>
        <template #cell-selling_price="{ value }">${{ Number(value).toFixed(2) }}</template>
        <template #cell-status="{ value }">
          <AppBadge :color="value === 'ACTIVE' ? 'green' : 'default'">{{ value }}</AppBadge>
        </template>
        <template #actions="{ row }">
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            <AppButton variant="default" size="sm" @click="openQr(row)">
              <template #icon-left>
                <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
              </template>
              <span class="kh-text">ស្លាកទំនិញ / Barcode</span>
            </AppButton>
            <AppButton variant="ghost" size="sm" @click="openEdit(row)">Edit</AppButton>
            <AppButton variant="ghost" size="sm" @click="confirmDelete(row)">Delete</AppButton>
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal v-model="showForm" :title="editTarget ? 'Edit Variant' : 'Add Variant'" size="lg">
      <form class="form-grid" @submit.prevent="saveVariant">
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Color</label>
            <AppSelect v-model="form.color_id" :options="colorOptions" placeholder="Select color" />
          </div>
          <div class="form-field">
            <label class="field-label">Size</label>
            <AppSelect v-model="form.size_id" :options="sizeOptions" placeholder="Select size" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Cost Price ($)</label>
            <input v-model.number="form.cost_price" type="number" step="0.01" min="0" class="field-input" required />
          </div>
          <div class="form-field">
            <label class="field-label">Selling Price ($) <span class="required">*</span></label>
            <input v-model.number="form.selling_price" type="number" step="0.01" min="0" class="field-input" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Wholesale Price ($)</label>
            <input v-model.number="form.wholesale_price" type="number" step="0.01" min="0" class="field-input" />
          </div>
          <div class="form-field">
            <label class="field-label">Barcode</label>
            <input v-model="form.barcode" class="field-input" placeholder="Optional" />
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Status</label>
          <AppSelect v-model="form.status" :options="statusOptions" />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" @click="showForm = false">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="saving">
            {{ editTarget ? 'Save Changes' : 'Create Variant' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Sticker & Barcode Modal (Template C: Modern Khmer Product Sticker 50x30mm) -->
    <AppModal v-model="showQr" title="ស្លាកទំនិញ • Modern Khmer Product Sticker (50 × 30mm)" size="md">
      <div v-if="qrVariant" class="sticker-modal-wrap">
        <!-- Live 50x30mm Khmer Sticker Card Preview -->
        <div class="sticker-preview-stage">
          <div class="kh-product-sticker" style="--sticker-w: 50mm; --sticker-h: 30mm;">
            <div class="kh-sticker__store">
              ហាងលក់សម្លៀកបំពាក់ ភ្នំពេញ
            </div>
            <div class="kh-sticker__product-name">
              {{ product?.name || qrVariant.sku }}
            </div>
            <div class="kh-sticker__info-row">
              <div class="kh-sticker__meta">
                <div class="kh-sticker__sku-line">
                  SKU: <span class="mono font-bold">{{ qrVariant.sku }}</span>
                </div>
                <div class="kh-sticker__variant-line">
                  <span>ពណ៌: <strong>{{ qrVariant.color?.name || 'ទូទៅ' }}</strong></span>
                  <span class="kh-sticker__var-sep">ទំហំ: <strong>{{ qrVariant.size?.name || 'Free' }}</strong></span>
                </div>
              </div>
              <div class="kh-sticker__price-box">
                <div class="kh-sticker__price-usd">${{ Number(qrVariant.selling_price).toFixed(2) }}</div>
              </div>
            </div>
            <div class="kh-sticker__barcode-zone">
              <div class="kh-sticker__barcode-wrap">
                <img :src="barcodeUrl" :alt="qrVariant.barcode || qrVariant.sku" class="kh-sticker__barcode-img" />
              </div>
              <div class="kh-sticker__barcode-text">
                {{ qrVariant.barcode || qrVariant.sku }}
              </div>
            </div>
          </div>
        </div>

        <div class="qr-actions">
          <a :href="barcodeUrl" :download="`${qrVariant.sku}-barcode.svg`" target="_blank">
            <AppButton variant="default" size="sm">
              <template #icon-left>
                <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
              </template>
              Download Barcode SVG
            </AppButton>
          </a>
          <AppButton variant="primary" size="sm" :to="`/labels/generate?variant_id=${qrVariant.id}`">
            <template #icon-left>
              <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
            </template>
            <span class="kh-text">បោះពុម្ពស្លាកទំនិញ (Print Product Label)</span>
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductVariant, Color, Size } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Product Variants — Clothing Store' })

const { getProduct } = useProductApi()
const { listVariants, createVariant, updateVariant, deleteVariant, getBarcodeUrl } = useVariantApi()
const { listColors, listSizes } = useCatalogApi()
const { addToast } = useAppToast()

const product = ref<Product | null>(null)
const variants = ref<ProductVariant[]>([])
const colors = ref<Color[]>([])
const sizes = ref<Size[]>([])
const loading = ref(true)
const saving = ref(false)

const showForm = ref(false)
const showQr = ref(false)
const editTarget = ref<ProductVariant | null>(null)
const qrVariant = ref<ProductVariant | null>(null)

const form = reactive({
  color_id: '',
  size_id: '',
  cost_price: 0,
  selling_price: 0,
  wholesale_price: null as number | null,
  barcode: '',
  status: 'ACTIVE',
})

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const colorOptions = computed(() =>
  colors.value.map(c => ({ label: c.name, value: c.id }))
)
const sizeOptions = computed(() =>
  sizes.value.map(s => ({ label: s.name, value: s.id }))
)

const columns = [
  { key: 'sku', label: 'SKU' },
  { key: 'color', label: 'Color (ពណ៌)' },
  { key: 'size', label: 'Size (ទំហំ)' },
  { key: 'selling_price', label: 'Price' },
  { key: 'qr_reference', label: 'Barcode / Ref' },
  { key: 'status', label: 'Status' },
]

const barcodeUrl = computed(() =>
  qrVariant.value ? getBarcodeUrl(qrVariant.value.id, 'svg', false) : ''
)

function openCreate() {
  editTarget.value = null
  Object.assign(form, { color_id: '', size_id: '', cost_price: 0, selling_price: 0, wholesale_price: null, barcode: '', status: 'ACTIVE' })
  showForm.value = true
}

function openEdit(v: ProductVariant) {
  editTarget.value = v
  Object.assign(form, {
    color_id: v.color_id ?? '',
    size_id: v.size_id ?? '',
    cost_price: v.cost_price,
    selling_price: v.selling_price,
    wholesale_price: v.wholesale_price ?? null,
    barcode: v.barcode ?? '',
    status: v.status,
  })
  showForm.value = true
}

function openQr(v: ProductVariant) {
  qrVariant.value = v
  showQr.value = true
}

async function saveVariant() {
  saving.value = true
  try {
    const payload = {
      product_id: id,
      color_id: form.color_id || null,
      size_id: form.size_id || null,
      cost_price: form.cost_price,
      selling_price: form.selling_price,
      wholesale_price: form.wholesale_price,
      barcode: form.barcode || null,
      status: form.status,
    }
    if (editTarget.value) {
      await updateVariant(editTarget.value.id, payload)
      addToast({ type: 'success', title: 'Variant updated' })
    } else {
      await createVariant(payload)
      addToast({ type: 'success', title: 'Variant created' })
    }
    showForm.value = false
    await loadVariants()
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

async function confirmDelete(v: ProductVariant) {
  if (!confirm(`Delete variant ${v.sku}?`)) return
  try {
    await deleteVariant(v.id)
    addToast({ type: 'success', title: 'Variant deleted' })
    await loadVariants()
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  }
}

async function loadVariants() {
  const res = await listVariants({ product_id: id, limit: 200 }) as ProductVariant[]
  variants.value = res
}

onMounted(async () => {
  try {
    const [p, c, s] = await Promise.all([
      getProduct(id),
      listColors(),
      listSizes(),
    ])
    product.value = p as Product
    colors.value = c as Color[]
    sizes.value = s as Size[]
    await loadVariants()
  } finally {
    loading.value = false
  }
})
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

.color-cell { display: flex; align-items: center; gap: 6px; }
.color-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 1px solid var(--border-subtle); flex-shrink: 0; }

.form-grid { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 580px) { .form-row { grid-template-columns: 1fr; } }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.required { color: #ef4444; }
.field-input {
  padding: 8px 10px; font-size: 13px; background: var(--surface-inset);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  color: var(--text-primary); font-family: var(--font-body); outline: none;
  transition: border-color .15s; box-sizing: border-box; width: 100%;
}
.field-input:focus { border-color: var(--color-primary); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; }

.sticker-modal-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 8px; }
.sticker-preview-stage {
  background: #f1f5f9; border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  padding: 20px; width: 100%; display: flex; justify-content: center;
}
.mono { font-family: monospace; }
.qr-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
</style>
