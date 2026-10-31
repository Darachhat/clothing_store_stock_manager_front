<template>
  <div class="page-root">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Products</h2>
        <p class="page-subtitle">Manage your product catalog</p>
      </div>
      <AppButton variant="primary" to="/products/new">
        <template #icon-left>
          <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
        </template>
        New Product
      </AppButton>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="filter-bar__search">
        <UIcon name="i-heroicons-magnifying-glass" class="w-3.5 h-3.5" style="color:var(--text-tertiary); flex-shrink:0;" />
        <input
          v-model="search"
          class="filter-bar__input"
          placeholder="Search products…"
        />
      </div>
      <AppSelect
        v-model="statusFilter"
        :options="statusOptions"
        placeholder="All Statuses"
        style="width:160px;"
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
        <template #cell-status="{ value }">
          <AppBadge :color="value === 'ACTIVE' ? 'green' : value === 'DISCONTINUED' ? 'red' : 'default'">
            {{ value }}
          </AppBadge>
        </template>
        <template #actions="{ row }">
          <div style="display:flex; gap:4px; justify-content:flex-end;">
            <AppButton :to="`/products/${row.id}`" variant="ghost" size="sm">View</AppButton>
            <AppButton :to="`/products/${row.id}/edit`" variant="ghost" size="sm">Edit</AppButton>
            <AppButton :to="`/products/${row.id}/variants`" variant="default" size="sm">Variants</AppButton>
          </div>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Products — Clothing Store' })

const { listProducts } = useProductApi()
const search = ref('')
const statusFilter = ref('')
const products = ref<Product[]>([])
const loading = ref(false)

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Discontinued', value: 'DISCONTINUED' },
]

const columns = [
  { key: 'code',   label: 'Code' },
  { key: 'name',   label: 'Product Name' },
  { key: 'status', label: 'Status' },
]

function clearFilters() {
  search.value = ''
  statusFilter.value = ''
}

const debouncedLoad = useDebounceFn(async () => {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (search.value) params.q = search.value
    if (statusFilter.value) params.status = statusFilter.value
    const res: any = await listProducts(params)
    products.value = Array.isArray(res) ? res : (res?.items || [])
  } finally {
    loading.value = false
  }
}, 400)

watch([search, statusFilter], debouncedLoad, { immediate: true })
</script>

<style scoped>
.page-root { display: flex; flex-direction: column; gap: 16px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.page-subtitle {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
  max-width: none;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.filter-bar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.filter-bar__input {
  flex: 1;
  border: none;
  outline: none;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  min-width: 0;
}

.filter-bar__input::placeholder { color: var(--text-tertiary); }
</style>
