<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="flex flex-col gap-0.5">
        <NuxtLink :to="`/products/${id}`" class="inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink no-underline mb-1 transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          {{ product?.name ?? 'Product' }}
        </NuxtLink>
        <div class="flex items-center gap-2">
          <h2 class="text-base font-semibold text-ink tracking-tight">Product Variants &amp; Identification Codes</h2>
          <span class="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-bg px-2 py-0.5 text-[11px] font-medium text-ink-secondary">
            <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
            <span>Read-Only</span>
          </span>
        </div>
        <p class="text-xs text-ink-tertiary mt-0.5">
          Inspect SKUs, Color &amp; Size combinations, variant images, Code-128 barcodes, and 2D QR codes.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <AppButton variant="primary" :to="`/labels/generate?product_id=${id}`">
          <template #icon-left>
            <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
          </template>
          <span class="font-khmer">បោះពុម្ពស្លាកទំនិញ (Print Product Labels)</span>
        </AppButton>
      </div>
    </div>

    <!-- Search / Filter Variants -->
    <div class="flex items-center gap-2 p-3 sm:px-4 bg-surface-card border border-border-subtle rounded-lg flex-wrap">
      <div class="flex items-center gap-2 flex-1 min-w-[220px] h-9 px-2.5 bg-surface-bg border border-border-default rounded-md">
        <UIcon name="i-heroicons-magnifying-glass" class="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
        <input
          v-model="variantSearch"
          class="w-full bg-transparent border-none text-xs sm:text-sm text-ink outline-none placeholder:text-ink-tertiary"
          placeholder="Search variants by SKU, color, size, or barcode…"
        />
      </div>
    </div>

    <!-- Variants Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredVariants"
        :loading="loading"
        empty-text="No matching variants found."
      >
        <template #cell-sku="{ row }">
          <code class="font-mono text-xs font-semibold text-ink">{{ row.sku }}</code>
        </template>
        <template #cell-color="{ row }">
          <div class="flex items-center gap-1.5">
            <span v-if="row.color?.hex_code" class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle shrink-0" :style="{ background: row.color.hex_code }" />
            {{ row.color?.name ?? 'Standard' }}
          </div>
        </template>
        <template #cell-size="{ row }">
          <span class="font-mono">{{ row.size?.name ?? 'Free Size' }}</span>
        </template>
        <template #cell-barcode="{ row }">
          <code class="font-mono text-xs text-ink-secondary">{{ row.barcode || '—' }}</code>
        </template>
        <template #cell-selling_price="{ value }">
          <span class="font-mono font-semibold">${{ Number(value).toFixed(2) }}</span>
        </template>
        <template #cell-status="{ row }">
          <AppBadge :color="(row.status_code || row.status) === 'ACTIVE' ? 'green' : 'default'">
            {{ row.status_code || row.status || 'ACTIVE' }}
          </AppBadge>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <AppButton variant="default" size="sm" @click="openQr(row)">
              <template #icon-left>
                <UIcon name="i-heroicons-qr-code" class="w-3.5 h-3.5" />
              </template>
              <span>Preview Barcode &amp; QR</span>
            </AppButton>
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Barcode & QR Code Preview Modal -->
    <AppModal v-model="showQr" title="Variant Barcode (Code 128) &amp; QR Code Preview" size="md">
      <div v-if="qrVariant" class="flex flex-col items-center gap-4 p-2">
        <div class="bg-slate-100 border border-border-subtle rounded-md p-5 w-full flex flex-col items-center gap-4">
          <div class="kh-product-sticker" style="--sticker-w: 50mm; --sticker-h: 38mm;">
            <div class="kh-sticker__store flex items-center justify-between gap-1">
              <span class="inline-flex items-center px-1 py-0.2 rounded bg-ink text-white font-mono text-[9px] font-bold">KVC</span>
              <span class="truncate">គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់</span>
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

          <!-- 2D QR Code Preview -->
          <div class="rounded-lg border border-border-subtle bg-white p-3 flex items-center gap-3">
            <img :src="qrUrl" :alt="`QR for ${qrVariant.sku}`" class="w-16 h-16 object-contain" />
            <div class="text-xs">
              <div class="font-semibold text-ink">2D QR Code Reference</div>
              <code class="font-mono text-ink-secondary">{{ qrVariant.qr_reference }}</code>
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
            <span class="font-khmer">បោះពុម្ពស្លាកទំនិញ (Print Label)</span>
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductVariant } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Product Variants — Stock Manager' })

const { getProduct } = useProductApi()
const { listVariants, getBarcodeUrl, getQrUrl } = useVariantApi()

const product = ref<Product | null>(null)
const variants = ref<ProductVariant[]>([])
const variantSearch = ref('')
const loading = ref(true)

const showQr = ref(false)
const qrVariant = ref<ProductVariant | null>(null)

const columns = [
  { key: 'sku', label: 'SKU' },
  { key: 'color', label: 'Color (ពណ៌)' },
  { key: 'size', label: 'Size (ទំហំ)' },
  { key: 'barcode', label: 'Barcode (Code 128)' },
  { key: 'selling_price', label: 'Selling Price' },
  { key: 'status', label: 'Status' },
]

const filteredVariants = computed(() => {
  const q = variantSearch.value.trim().toLowerCase()
  if (!q) return variants.value
  return variants.value.filter(
    v =>
      v.sku?.toLowerCase().includes(q) ||
      v.barcode?.toLowerCase().includes(q) ||
      v.color?.name?.toLowerCase().includes(q) ||
      v.size?.name?.toLowerCase().includes(q),
  )
})

const barcodeUrl = computed(() =>
  qrVariant.value ? getBarcodeUrl(qrVariant.value.id, 'svg', false) : '',
)

const qrUrl = computed(() =>
  qrVariant.value ? getQrUrl(qrVariant.value.id, 'svg') : '',
)

function openQr(v: ProductVariant) {
  qrVariant.value = v
  showQr.value = true
}

onMounted(async () => {
  try {
    const [p, v] = await Promise.all([
      getProduct(id),
      listVariants({ product_id: id, limit: 300 }),
    ])
    product.value = p as Product
    variants.value = Array.isArray(v) ? (v as ProductVariant[]) : ((v as any)?.items || [])
  } finally {
    loading.value = false
  }
})
</script>
