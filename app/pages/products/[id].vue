<template>
  <div class="page-root">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header__left">
        <NuxtLink to="/products" class="back-link">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Products
        </NuxtLink>
        <h2 class="page-title">{{ product?.name ?? '…' }}</h2>
        <p class="page-subtitle">{{ product?.code }}</p>
      </div>
      <div class="page-header__actions">
        <AppButton variant="ghost" :to="`/products/${id}/variants`">Manage Variants</AppButton>
        <AppButton variant="default" :to="`/products/${id}/edit`">Edit Product</AppButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-card">
      <UIcon name="i-heroicons-arrow-path" class="spinner w-5 h-5" />
      Loading product…
    </div>

    <template v-else-if="product">
      <div class="detail-grid">
        <!-- Left: Info -->
        <div class="detail-col">
          <!-- Product image -->
          <AppCard>
            <div class="product-image-wrap">
              <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="product-image" />
              <div v-else class="product-image-placeholder">
                <UIcon name="i-heroicons-photo" class="w-10 h-10 text-slate-400" />
              </div>
            </div>
          </AppCard>

          <!-- Details -->
          <AppCard title="Product Details">
            <dl class="detail-list">
              <div class="detail-row">
                <dt>Code</dt>
                <dd><code class="mono">{{ product.code }}</code></dd>
              </div>
              <div class="detail-row">
                <dt>Status</dt>
                <dd>
                  <AppBadge :color="product.status === 'ACTIVE' ? 'green' : product.status === 'DISCONTINUED' ? 'red' : 'default'">
                    {{ product.status }}
                  </AppBadge>
                </dd>
              </div>
              <div class="detail-row">
                <dt>Category</dt>
                <dd>{{ product.category?.name ?? '—' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Brand</dt>
                <dd>{{ product.brand?.name ?? '—' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Slug</dt>
                <dd><code class="mono">{{ product.slug }}</code></dd>
              </div>
              <div class="detail-row">
                <dt>Created</dt>
                <dd>{{ fmtDate(product.created_at || '') }}</dd>
              </div>
              <div class="detail-row">
                <dt>Updated</dt>
                <dd>{{ fmtDate(product.updated_at || '') }}</dd>
              </div>
            </dl>
          </AppCard>
        </div>

        <!-- Right: Description + Variants -->
        <div class="detail-col">
          <AppCard title="Description">
            <p v-if="product.description" class="description-text">{{ product.description }}</p>
            <p v-else class="empty-text">No description.</p>
          </AppCard>

          <AppCard title="Variants">
            <div v-if="!product.variants?.length" class="empty-text">No variants yet.</div>
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
            <div style="margin-top:12px;">
              <AppButton variant="default" size="sm" :to="`/products/${id}/variants`">Manage Variants →</AppButton>
            </div>
          </AppCard>
        </div>
      </div>
    </template>

    <div v-else class="state-card">Product not found.</div>
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

<style scoped>
.page-root { display: flex; flex-direction: column; gap: 16px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.page-header__left { display: flex; flex-direction: column; gap: 2px; }
.page-header__actions { display: flex; gap: 8px; align-items: center; }

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
  text-decoration: none;
  margin-bottom: 4px;
}
.back-link:hover { color: var(--text-primary); }

.page-title { font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
.page-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }

.state-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  color: var(--text-tertiary);
  font-size: 13px;
}

.spinner { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.detail-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 768px) {
  .detail-grid { grid-template-columns: 1fr; }
}

.detail-col { display: flex; flex-direction: column; gap: 16px; }

.product-image-wrap {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-inset);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.product-image { width: 100%; height: 100%; object-fit: cover; }
.product-image-placeholder { color: var(--text-muted); }

.detail-list { display: flex; flex-direction: column; gap: 0; }
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
}
.detail-row:last-child { border-bottom: none; }
.detail-row dt { color: var(--text-tertiary); }
.detail-row dd { color: var(--text-primary); font-weight: 500; }

.mono { font-family: var(--font-mono, monospace); font-size: 12px; }

.description-text { font-size: 13px; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; }
.empty-text { font-size: 13px; color: var(--text-tertiary); font-style: italic; }
</style>
