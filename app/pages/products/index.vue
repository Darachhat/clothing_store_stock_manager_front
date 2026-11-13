<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-base font-semibold text-ink tracking-tight">Product &amp; Variant Catalog</h2>
          <span class="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-bg px-2 py-0.5 text-[11px] font-medium text-ink-secondary">
            <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
            <span>Read-Only View</span>
          </span>
        </div>
        <p class="text-xs text-ink-tertiary mt-0.5">
          Search products by name, code, or SKU, or scan a 1D barcode / 2D QR code to inspect variants and labels.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton variant="default" size="sm" to="/labels/generate">
          <template #icon-left>
            <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
          </template>
          Label Studio
        </AppButton>
      </div>
    </div>

    <!-- Barcode / QR / SKU Quick Scanner Bar -->
    <div class="p-3 sm:px-4 bg-surface-card border border-border-subtle rounded-lg flex flex-col gap-3">
      <form class="flex flex-wrap items-center gap-2" @submit.prevent="handleScanLookup">
        <div class="flex items-center gap-2 flex-1 min-w-[240px] h-9 px-2.5 bg-surface-bg border border-border-default rounded-md">
          <UIcon name="i-heroicons-qr-code" class="w-4 h-4 text-ink-secondary shrink-0" />
          <input
            v-model="scanInput"
            class="w-full bg-transparent border-none text-xs sm:text-sm font-mono text-ink outline-none placeholder:text-ink-tertiary"
            placeholder="Scan barcode, QR code, or enter exact SKU (e.g. TSH-001-BLK-S) and press Enter…"
          />
        </div>
        <AppButton type="submit" variant="primary" size="sm" :loading="scanning">
          <template #icon-left>
            <UIcon name="i-heroicons-magnifying-glass" class="w-3.5 h-3.5" />
          </template>
          Lookup Code
        </AppButton>
        <AppButton v-if="scanResult || scanError" type="button" variant="ghost" size="sm" @click="clearScan">
          Clear Scan
        </AppButton>
      </form>

      <!-- Scan Result Banner -->
      <div
        v-if="scanError"
        class="p-3 rounded-md bg-surface-bg border border-border-subtle flex items-center justify-between gap-2 text-xs text-ink"
      >
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 text-ink-secondary shrink-0" />
          <span>{{ scanError }}</span>
        </div>
      </div>

      <div
        v-if="scanResult"
        class="p-3 rounded-md bg-surface-bg border border-border-subtle flex flex-wrap items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-md border border-border-subtle bg-surface-card overflow-hidden flex items-center justify-center shrink-0">
            <img
              v-if="scanResult.variant?.image_url || scanResult.product?.image_url"
              :src="(scanResult.variant?.image_url || scanResult.product?.image_url)!"
              alt="Scanned item"
              class="w-full h-full object-cover"
            />
            <UIcon v-else name="i-heroicons-tag" class="w-5 h-5 text-ink-tertiary" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-ink">
                {{ scanResult.product?.name || scanResult.variant?.product?.name || 'Matched Product' }}
              </span>
              <code v-if="scanResult.variant" class="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-surface-card border border-border-subtle text-ink">
                {{ scanResult.variant.sku }}
              </code>
            </div>
            <div class="text-xs text-ink-secondary mt-0.5 flex flex-wrap items-center gap-2">
              <span v-if="scanResult.variant">
                Color: <strong>{{ scanResult.variant.color?.name || 'Standard' }}</strong> ·
                Size: <strong>{{ scanResult.variant.size?.name || 'Free Size' }}</strong> ·
                Barcode: <code class="font-mono">{{ scanResult.variant.barcode || '—' }}</code> ·
                Selling Price: <strong class="font-mono">${{ Number(scanResult.variant.selling_price ?? 0).toFixed(2) }}</strong>
              </span>
              <span v-else>
                Product Code: <code class="font-mono">{{ scanResult.product?.code }}</code> ·
                {{ scanResult.variants?.length || 0 }} variant(s)
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <AppButton
            v-if="scanResult.product?.id || scanResult.variant?.product_id"
            size="sm"
            variant="default"
            :to="`/products/${scanResult.product?.id || scanResult.variant?.product_id}`"
          >
            Open Product Detail
          </AppButton>
          <AppButton
            v-if="scanResult.product?.id || scanResult.variant?.product_id"
            size="sm"
            variant="primary"
            :to="`/products/${scanResult.product?.id || scanResult.variant?.product_id}/variants`"
          >
            Inspect Variants &amp; Labels
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-2 p-3 sm:px-4 bg-surface-card border border-border-subtle rounded-lg flex-wrap">
      <div class="flex items-center gap-2 flex-1 min-w-[200px] h-9 px-2.5 bg-surface-card border border-border-default rounded-md">
        <UIcon name="i-heroicons-magnifying-glass" class="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
        <input
          v-model="search"
          class="w-full bg-transparent border-none text-xs sm:text-sm text-ink outline-none placeholder:text-ink-tertiary"
          placeholder="Filter products by name, product code, or SKU…"
        />
      </div>
      <AppSelect
        v-model="categoryFilter"
        :options="categoryOptions"
        placeholder="All Categories"
        class="w-44"
      />
      <AppSelect
        v-model="brandFilter"
        :options="brandOptions"
        placeholder="All Brands"
        class="w-40"
      />
      <AppSelect
        v-model="statusFilter"
        :options="statusOptions"
        placeholder="All Statuses"
        class="w-40"
      />
      <AppButton variant="ghost" size="sm" @click="clearFilters">Clear</AppButton>
    </div>

    <!-- Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="products"
        :loading="loading"
        empty-text="No products found."
      >
        <template #cell-code="{ row }">
          <code class="font-mono text-xs font-semibold text-ink">{{ row.code || '—' }}</code>
        </template>
        <template #cell-name="{ row }">
          <div class="flex items-center gap-2.5">
            <img
              v-if="primaryImageOf(row)"
              :src="primaryImageOf(row)!"
              :alt="row.name"
              class="w-9 h-9 rounded-md border border-border-subtle object-cover shrink-0 bg-surface-bg"
            />
            <div v-else class="w-9 h-9 rounded-md border border-border-subtle bg-surface-bg flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-photo" class="w-4 h-4 text-ink-tertiary" />
            </div>
            <div>
              <NuxtLink :to="`/products/${row.id}`" class="text-xs sm:text-sm font-medium text-ink hover:underline no-underline">
                {{ row.name }}
              </NuxtLink>
              <div class="text-[11px] text-ink-tertiary">
                {{ row.category?.name || 'Uncategorized' }} · {{ row.brand?.name || 'No Brand' }}
              </div>
            </div>
          </div>
        </template>
        <template #cell-variant_count="{ row }">
          <span class="font-mono text-xs font-semibold text-ink">{{ (row as any).variant_count ?? row.variants?.length ?? 0 }}</span>
        </template>
        <template #cell-price_range="{ row }">
          <span class="font-mono text-xs text-ink">{{ priceRangeOf(row) }}</span>
        </template>
        <template #cell-status="{ row }">
          <AppBadge :color="(row.status_code || row.status) === 'ACTIVE' ? 'green' : (row.status_code || row.status) === 'DISCONTINUED' ? 'red' : 'default'">
            {{ row.status_code || row.status || 'ACTIVE' }}
          </AppBadge>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <AppButton :to="`/products/${row.id}`" variant="ghost" size="sm">
              <template #icon-left>
                <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
              </template>
              Details
            </AppButton>
            <AppButton :to="`/products/${row.id}/variants`" variant="default" size="sm">
              <template #icon-left>
                <UIcon name="i-heroicons-qr-code" class="w-3.5 h-3.5" />
              </template>
              Variants &amp; Codes
            </AppButton>
          </div>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Product Catalog — Stock Manager' })

const { listProducts, scanCode } = useProductApi()
const { listCategories, listBrands } = useCatalogApi()

const search = ref('')
const categoryFilter = ref('')
const brandFilter = ref('')
const statusFilter = ref('')
const products = ref<Product[]>([])
const categories = ref<any[]>([])
const brands = ref<any[]>([])
const loading = ref(false)

const scanInput = ref('')
const scanning = ref(false)
const scanResult = ref<any | null>(null)
const scanError = ref('')

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Discontinued', value: 'DISCONTINUED' },
]

const categoryOptions = computed(() =>
  categories.value.map(c => ({ label: c.name, value: c.id })),
)
const brandOptions = computed(() =>
  brands.value.map(b => ({ label: b.name, value: b.id })),
)

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Product' },
  { key: 'variant_count', label: 'Variants' },
  { key: 'price_range', label: 'Selling Price' },
  { key: 'status', label: 'Status' },
]

function primaryImageOf(p: any): string | null {
  if (p.image_url) return p.image_url
  if (Array.isArray(p.images) && p.images.length > 0) {
    const primary = p.images.find((i: any) => i.is_primary)
    return (primary || p.images[0])?.image_url || null
  }
  return null
}

function priceRangeOf(p: any): string {
  const min = p.min_price !== undefined && p.min_price !== null ? Number(p.min_price) : null
  const max = p.max_price !== undefined && p.max_price !== null ? Number(p.max_price) : null
  if (min !== null && max !== null && Number.isFinite(min) && Number.isFinite(max)) {
    return Math.abs(min - max) < 0.005 ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} – $${max.toFixed(2)}`
  }
  return '—'
}

async function handleScanLookup() {
  const code = scanInput.value.trim()
  if (!code) return
  scanning.value = true
  scanError.value = ''
  scanResult.value = null
  try {
    const res = await scanCode(code)
    scanResult.value = res
  } catch (e: any) {
    scanError.value = e?.data?.detail || `No product or variant matched code "${code}".`
  } finally {
    scanning.value = false
  }
}

function clearScan() {
  scanInput.value = ''
  scanResult.value = null
  scanError.value = ''
}

function clearFilters() {
  search.value = ''
  categoryFilter.value = ''
  brandFilter.value = ''
  statusFilter.value = ''
}

const debouncedLoad = useDebounceFn(async () => {
  loading.value = true
  try {
    const params: Record<string, string> = { status: statusFilter.value || 'ALL' }
    if (search.value.trim()) params.q = search.value.trim()
    if (categoryFilter.value) params.category_id = categoryFilter.value
    if (brandFilter.value) params.brand_id = brandFilter.value
    const res: any = await listProducts(params)
    products.value = Array.isArray(res) ? res : (res?.items || [])
  } finally {
    loading.value = false
  }
}, 350)

watch([search, categoryFilter, brandFilter, statusFilter], debouncedLoad, { immediate: true })

onMounted(async () => {
  const [cats, brs] = await Promise.all([
    listCategories().catch(() => []),
    listBrands().catch(() => []),
  ])
  categories.value = Array.isArray(cats) ? cats : ((cats as any)?.items || [])
  brands.value = Array.isArray(brs) ? brs : ((brs as any)?.items || [])
})
</script>
