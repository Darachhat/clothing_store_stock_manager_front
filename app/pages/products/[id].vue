<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="flex flex-col gap-0.5">
        <NuxtLink to="/products" class="inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink no-underline mb-1 transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Back to Product Catalog
        </NuxtLink>
        <div class="flex items-center gap-2">
          <h2 class="text-base font-semibold text-ink tracking-tight">{{ product?.name ?? 'Loading…' }}</h2>
          <span class="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-bg px-2 py-0.5 text-[11px] font-medium text-ink-secondary">
            <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
            <span>Read-Only</span>
          </span>
        </div>
        <p class="text-xs text-ink-tertiary mt-0.5 font-mono">{{ product?.code }}</p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton variant="default" size="sm" :to="`/labels/generate?product_id=${id}`">
          <template #icon-left>
            <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
          </template>
          Print Labels
        </AppButton>
        <AppButton variant="primary" size="sm" :to="`/products/${id}/variants`">
          <template #icon-left>
            <UIcon name="i-heroicons-qr-code" class="w-3.5 h-3.5" />
          </template>
          View All Variants &amp; Codes
        </AppButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center gap-2 p-12 bg-surface-card border border-border-subtle rounded-lg text-ink-tertiary text-xs sm:text-sm">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
      Loading product…
    </div>

    <template v-else-if="product">
      <div class="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 items-start">
        <!-- Left: Gallery & Details -->
        <div class="flex flex-col gap-4">
          <AppCard>
            <div class="w-full aspect-square flex items-center justify-center bg-surface-bg rounded-md overflow-hidden border border-border-subtle">
              <img v-if="activePreviewImage" :src="activePreviewImage" :alt="product.name" class="w-full h-full object-cover" />
              <div v-else class="text-ink-tertiary">
                <UIcon name="i-heroicons-photo" class="w-10 h-10" />
              </div>
            </div>
            <!-- Thumbnail strip for multi-image gallery -->
            <div v-if="galleryImages.length > 1" class="grid grid-cols-4 gap-2 mt-3">
              <button
                v-for="img in galleryImages"
                :key="img.id"
                type="button"
                class="aspect-square rounded border overflow-hidden bg-surface-bg"
                :class="activePreviewImage === img.image_url ? 'border-ink' : 'border-border-subtle'"
                @click="selectedImageUrl = img.image_url"
              >
                <img :src="img.image_url" :alt="product.name" class="w-full h-full object-cover" />
              </button>
            </div>
          </AppCard>

          <AppCard title="Product Specifications">
            <dl class="flex flex-col">
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]">
                <dt class="text-ink-tertiary">Product Code</dt>
                <dd class="text-ink font-medium m-0"><code class="font-mono text-xs">{{ product.code }}</code></dd>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]">
                <dt class="text-ink-tertiary">Status</dt>
                <dd class="text-ink font-medium m-0">
                  <AppBadge :color="(product.status_code || product.status) === 'ACTIVE' ? 'green' : (product.status_code || product.status) === 'DISCONTINUED' ? 'red' : 'default'">
                    {{ product.status_code || product.status }}
                  </AppBadge>
                </dd>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]">
                <dt class="text-ink-tertiary">Category</dt>
                <dd class="text-ink font-medium m-0">{{ product.category?.name ?? '—' }}</dd>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]">
                <dt class="text-ink-tertiary">Brand</dt>
                <dd class="text-ink font-medium m-0">{{ product.brand?.name ?? '—' }}</dd>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]">
                <dt class="text-ink-tertiary">Total Variants</dt>
                <dd class="text-ink font-mono font-semibold m-0">{{ product.variants?.length ?? 0 }}</dd>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]">
                <dt class="text-ink-tertiary">Created</dt>
                <dd class="text-ink font-medium m-0">{{ fmtDate(product.created_at || '') }}</dd>
              </div>
              <div class="flex justify-between items-center py-2 border-b-0 text-xs sm:text-[13px]">
                <dt class="text-ink-tertiary">Updated</dt>
                <dd class="text-ink font-medium m-0">{{ fmtDate(product.updated_at || '') }}</dd>
              </div>
            </dl>
          </AppCard>
        </div>

        <!-- Right: Description, Attributes, and Read-Only Variants Table -->
        <div class="flex flex-col gap-4">
          <AppCard title="Description &amp; Tags">
            <p v-if="product.description" class="text-xs sm:text-[13px] text-ink-secondary leading-relaxed whitespace-pre-wrap m-0">
              {{ product.description }}
            </p>
            <p v-else class="text-xs sm:text-[13px] text-ink-tertiary italic m-0">No description.</p>

            <div v-if="(product as any).tags?.length" class="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border-subtle">
              <span
                v-for="tag in (product as any).tags"
                :key="tag"
                class="rounded-md border border-border-subtle bg-surface-bg px-2 py-0.5 text-xs text-ink"
              >
                {{ tag }}
              </span>
            </div>
          </AppCard>

          <AppCard title="Product Attributes">
            <div v-if="groupedAttributes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                v-for="group in groupedAttributes"
                :key="group.name"
                class="rounded-md border border-border-subtle bg-surface-bg p-2.5"
              >
                <div class="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">{{ group.name }}</div>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="v in group.values"
                    :key="v"
                    class="rounded border border-border-subtle bg-surface-card px-2 py-0.5 text-xs font-medium text-ink"
                  >
                    {{ v }}
                  </span>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-ink-tertiary italic m-0">No product attributes assigned.</p>
          </AppCard>

          <AppCard :title="`Product Variants (${product.variants?.length || 0})`" :no-pad="true">
            <AppTable
              :columns="variantCols"
              :rows="product.variants || []"
              :loading="false"
              empty-text="No variants configured."
            >
              <template #cell-sku="{ row }">
                <code class="font-mono text-xs font-semibold text-ink">{{ row.sku }}</code>
              </template>
              <template #cell-color="{ row }">
                <div class="flex items-center gap-1.5">
                  <span
                    v-if="row.color?.hex_code"
                    class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle"
                    :style="{ background: row.color.hex_code }"
                  />
                  <span>{{ row.color?.name ?? 'Standard' }}</span>
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
            </AppTable>
            <div class="p-3 border-t border-border-subtle flex justify-end">
              <AppButton variant="default" size="sm" :to="`/products/${id}/variants`">
                Inspect Barcodes &amp; QR Codes →
              </AppButton>
            </div>
          </AppCard>
        </div>
      </div>
    </template>

    <div v-else class="flex items-center justify-center gap-2 p-12 bg-surface-card border border-border-subtle rounded-lg text-ink-tertiary text-xs sm:text-sm">
      Product not found.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Product Detail — Stock Manager' })

const { getProduct } = useProductApi()
const product = ref<Product | null>(null)
const loading = ref(true)
const selectedImageUrl = ref<string | null>(null)

const galleryImages = computed<any[]>(() => {
  const p = product.value as any
  if (!p) return []
  if (Array.isArray(p.images) && p.images.length > 0) return p.images
  if (p.image_url) return [{ id: 'primary', image_url: p.image_url, is_primary: true }]
  return []
})

const activePreviewImage = computed(() => {
  if (selectedImageUrl.value) return selectedImageUrl.value
  const primary = galleryImages.value.find(i => i.is_primary)
  return (primary || galleryImages.value[0])?.image_url || product.value?.image_url || null
})

const groupedAttributes = computed(() => {
  const assigns = (product.value as any)?.attribute_assignments || []
  const map = new Map<string, string[]>()
  for (const a of assigns) {
    const label = a.attribute_display_name || a.attribute_name || 'Attribute'
    const val = a.display_value || a.value || ''
    if (!val) continue
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(val)
  }
  return Array.from(map.entries()).map(([name, values]) => ({ name, values }))
})

const variantCols = [
  { key: 'sku', label: 'SKU' },
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Size' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'selling_price', label: 'Selling Price' },
  { key: 'status', label: 'Status' },
]

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

onMounted(async () => {
  try {
    product.value = await getProduct(id) as Product
  } finally {
    loading.value = false
  }
})
</script>
