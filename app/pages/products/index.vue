<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-ink tracking-tight">Products</h2>
        <p class="text-xs text-ink-tertiary mt-0.5">Manage your product catalog</p>
      </div>
      <AppButton variant="primary" to="/products/new">
        <template #icon-left>
          <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
        </template>
        New Product
      </AppButton>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-2 p-3 sm:px-4 bg-surface-card border border-border-subtle rounded-lg flex-wrap">
      <div class="flex items-center gap-2 flex-1 min-w-[200px] h-9 px-2.5 bg-surface-card border border-border-default rounded-md">
        <UIcon name="i-heroicons-magnifying-glass" class="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
        <input
          v-model="search"
          class="w-full bg-transparent border-none text-xs sm:text-sm text-ink outline-none placeholder:text-ink-tertiary"
          placeholder="Search products…"
        />
      </div>
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
        <template #cell-status="{ value }">
          <AppBadge :color="value === 'ACTIVE' ? 'green' : value === 'DISCONTINUED' ? 'red' : 'default'">
            {{ value }}
          </AppBadge>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center gap-1 justify-end">
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
