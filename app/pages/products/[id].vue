<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="flex flex-col gap-0.5">
        <NuxtLink to="/products" class="inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink no-underline mb-1 transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Products
        </NuxtLink>
        <h2 class="text-base font-semibold text-ink tracking-tight">{{ product?.name ?? '…' }}</h2>
        <p class="text-xs text-ink-tertiary mt-0.5">{{ product?.code }}</p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton variant="ghost" :to="`/products/${id}/variants`">Manage Variants</AppButton>
        <AppButton variant="default" :to="`/products/${id}/edit`">Edit Product</AppButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center gap-2 p-12 bg-surface-card border border-border-subtle rounded-lg text-ink-tertiary text-xs sm:text-sm">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
      Loading product…
    </div>

    <template v-else-if="product">
      <div class="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 items-start">
        <!-- Left: Info -->
        <div class="flex flex-col gap-4">
          <!-- Product image -->
          <AppCard>
            <div class="w-full aspect-square flex items-center justify-center bg-surface-bg rounded-md overflow-hidden border border-border-subtle">
              <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="w-full h-full object-cover" />
              <div v-else class="text-slate-400">
                <UIcon name="i-heroicons-photo" class="w-10 h-10 text-slate-400" />
              </div>
            </div>
          </AppCard>

          <!-- Details -->
          <AppCard title="Product Details">
            <dl class="flex flex-col">
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]">
                <dt class="text-ink-tertiary">Code</dt>
                <dd class="text-ink font-medium m-0"><code class="font-mono text-xs">{{ product.code }}</code></dd>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]">
                <dt class="text-ink-tertiary">Status</dt>
                <dd class="text-ink font-medium m-0">
                  <AppBadge :color="product.status === 'ACTIVE' ? 'green' : product.status === 'DISCONTINUED' ? 'red' : 'default'">
                    {{ product.status }}
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
                <dt class="text-ink-tertiary">Slug</dt>
                <dd class="text-ink font-medium m-0"><code class="font-mono text-xs">{{ product.slug }}</code></dd>
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

        <!-- Right: Description + Variants -->
        <div class="flex flex-col gap-4">
          <AppCard title="Description">
            <p v-if="product.description" class="text-xs sm:text-[13px] text-ink-secondary leading-relaxed whitespace-pre-wrap">{{ product.description }}</p>
            <p v-else class="text-xs sm:text-[13px] text-ink-tertiary italic">No description.</p>
          </AppCard>

          <AppCard title="Variants">
            <div v-if="!product.variants?.length" class="text-xs sm:text-[13px] text-ink-tertiary italic">No variants yet.</div>
            <AppTable
              v-else
              :columns="variantCols"
              :rows="product.variants"
              :loading="false"
              empty-text="No variants."
            >
              <template #cell-status="{ value }">
                <AppBadge :color="value === 'ACTIVE' ? 'green' : 'default'">{{ value }}</AppBadge>
              </template>
              <template #cell-selling_price="{ value }">
                ${{ Number(value).toFixed(2) }}
              </template>
            </AppTable>
            <div class="mt-3">
              <AppButton variant="default" size="sm" :to="`/products/${id}/variants`">Manage Variants →</AppButton>
            </div>
          </AppCard>
        </div>
      </div>
    </template>

    <div v-else class="flex items-center justify-center gap-2 p-12 bg-surface-card border border-border-subtle rounded-lg text-ink-tertiary text-xs sm:text-sm">Product not found.</div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Product Detail — Clothing Store' })

const { getProduct } = useProductApi()
const product = ref<Product | null>(null)
const loading = ref(true)

const variantCols = [
  { key: 'sku', label: 'SKU' },
  { key: 'selling_price', label: 'Price' },
  { key: 'status', label: 'Status' },
]

function fmtDate(d: string) {
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
