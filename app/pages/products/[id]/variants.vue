<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="flex flex-col gap-0.5">
        <NuxtLink :to="`/products/${id}`" class="inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink no-underline mb-1 transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          {{ product?.name ?? 'Product' }}
        </NuxtLink>
        <h2 class="text-base font-semibold text-ink tracking-tight">Product Variants</h2>
        <p class="text-xs text-ink-tertiary mt-0.5">Manage sizes, colors, SKUs, barcodes, and Khmer garment stickers</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <AppButton variant="default" :to="`/labels/generate?product_id=${id}`">
          <template #icon-left>
            <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
          </template>
          <span class="font-khmer">បោះពុម្ពស្លាកទំនិញ (Print Product Label)</span>
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
          <div class="flex items-center gap-1.5">
            <span v-if="row.color?.hex_code" class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle shrink-0" :style="{ background: row.color.hex_code }" />
            {{ row.color?.name ?? '—' }}
          </div>
        </template>
        <template #cell-size="{ row }">{{ row.size?.name ?? '—' }}</template>
        <template #cell-selling_price="{ value }">${{ Number(value).toFixed(2) }}</template>
        <template #cell-status="{ value }">
          <AppBadge :color="value === 'ACTIVE' ? 'green' : 'default'">{{ value }}</AppBadge>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <AppButton variant="default" size="sm" @click="openQr(row)">
              <template #icon-left>
                <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
              </template>
              <span class="font-khmer">ស្លាកទំនិញ / Barcode</span>
            </AppButton>
            <AppButton variant="ghost" size="sm" @click="openEdit(row)">Edit</AppButton>
            <AppButton variant="ghost" size="sm" @click="confirmDelete(row)">Delete</AppButton>
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal v-model="showForm" :title="editTarget ? 'Edit Variant' : 'Add Variant'" size="lg">
      <form class="flex flex-col gap-3.5" @submit.prevent="saveVariant">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Color</label>
            <AppSelect v-model="form.color_id" :options="colorOptions" placeholder="Select color" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Size</label>
            <AppSelect v-model="form.size_id" :options="sizeOptions" placeholder="Select size" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Cost Price ($)</label>
            <input v-model.number="form.cost_price" type="number" step="0.01" min="0" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Selling Price ($) <span class="text-status-red">*</span></label>
            <input v-model.number="form.selling_price" type="number" step="0.01" min="0" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" required />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Wholesale Price ($)</label>
            <input v-model.number="form.wholesale_price" type="number" step="0.01" min="0" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Barcode</label>
            <input v-model="form.barcode" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" placeholder="Optional" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-secondary">Status</label>
          <AppSelect v-model="form.status" :options="statusOptions" />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-border-subtle">
          <AppButton type="button" variant="ghost" @click="showForm = false">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="saving">
            {{ editTarget ? 'Save Changes' : 'Create Variant' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Sticker & Barcode Modal (Template C: Modern Khmer Product Sticker 50x30mm) -->
    <AppModal v-model="showQr" title="ស្លាកទំនិញ • Modern Khmer Product Sticker (50 × 30mm)" size="md">
      <div v-if="qrVariant" class="flex flex-col items-center gap-4 p-2">
        <!-- Live 50x30mm Khmer Sticker Card Preview -->
        <div class="bg-slate-100 border border-border-subtle rounded-md p-5 w-full flex justify-center">
          <div class="kh-product-sticker" style="--sticker-w: 50mm; --sticker-h: 30mm;">
            <div class="kh-sticker__store">
              គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ 
            </div>
            <div class="kh-sticker__product-name">
              {{ product?.name || qrVariant.sku }}
            </div>
            <div class="kh-sticker__info-row">
              <div class="kh-sticker__meta">
                <div class="kh-sticker__sku-line">
                  SKU: <span class="font-mono font-bold">{{ qrVariant.sku }}</span>
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

        <div class="flex items-center gap-2 flex-wrap justify-center">
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
            <span class="font-khmer">បោះពុម្ពស្លាកទំនិញ (Print Product Label)</span>
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
