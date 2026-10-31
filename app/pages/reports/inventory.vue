<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Inventory Report</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Stock value, coverage, and reorder alerts</p>
      </div>
      <AppButton variant="default" label="Export CSV" @click="exportCsv" />
    </div>

    <!-- Summary KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Total SKUs</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.totalSkus }}</p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Total Stock Units</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.totalUnits }}</p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Out of Stock</p>
        <p class="text-2xl font-bold text-red-600">{{ summary.outOfStock }}</p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Low Stock Alerts</p>
        <p class="text-2xl font-bold text-amber-500">{{ summary.lowStock }}</p>
      </AppCard>
    </div>

    <!-- Filters -->
    <AppCard>
      <div class="flex gap-3 flex-wrap">
        <AppInput v-model="search" placeholder="Search SKU..." class="w-56" />
        <AppSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="All statuses"
          class="w-44"
        />
      </div>
    </AppCard>

    <!-- Inventory Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="filteredRows"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-clipboard-document-list', label: 'No inventory data found' }"
      >
        <template #cell-quantity="{ row }">
          <span
            class="font-bold"
            :class="row.quantity <= 0 ? 'text-red-500' : row.quantity <= (row.reorder_level || 5) ? 'text-amber-500' : 'text-emerald-600'"
          >
            {{ row.quantity }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="row.quantity <= 0 ? 'red' : row.quantity <= (row.reorder_level || 5) ? 'amber' : 'emerald'"
            :label="row.quantity <= 0 ? 'Out of Stock' : row.quantity <= (row.reorder_level || 5) ? 'Low Stock' : 'In Stock'"
            size="sm"
            variant="subtle"
          />
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const invApi = useInventoryApi()
const toast = useAppToast()

const loading = ref(false)
const stocks = ref<any[]>([])
const search = ref('')
const statusFilter = ref('')

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'In Stock', value: 'in' },
  { label: 'Low Stock', value: 'low' },
  { label: 'Out of Stock', value: 'out' },
]

const columns = [
  { key: 'sku', label: 'SKU' },
  { key: 'product_name', label: 'Product' },
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Size' },
  { key: 'quantity', label: 'Qty' },
  { key: 'reorder_level', label: 'Reorder At' },
  { key: 'status', label: 'Status' },
]

const filteredRows = computed(() => {
  return stocks.value.filter(s => {
    const matchSearch = !search.value || (s.sku || '').toLowerCase().includes(search.value.toLowerCase()) ||
      (s.product_name || '').toLowerCase().includes(search.value.toLowerCase())
    let matchStatus = true
    if (statusFilter.value === 'out') matchStatus = s.quantity <= 0
    else if (statusFilter.value === 'low') matchStatus = s.quantity > 0 && s.quantity <= (s.reorder_level || 5)
    else if (statusFilter.value === 'in') matchStatus = s.quantity > (s.reorder_level || 5)
    return matchSearch && matchStatus
  })
})

const summary = computed(() => ({
  totalSkus: stocks.value.length,
  totalUnits: stocks.value.reduce((a, s) => a + s.quantity, 0),
  outOfStock: stocks.value.filter(s => s.quantity <= 0).length,
  lowStock: stocks.value.filter(s => s.quantity > 0 && s.quantity <= (s.reorder_level || 5)).length,
}))

async function fetchStocks() {
  loading.value = true
  try {
    const data = await invApi.listStocks({ limit: 500 }) as any[]
    stocks.value = data
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  if (!filteredRows.value.length) return
  const headers = columns.map(c => c.label)
  const lines = filteredRows.value.map(r => columns.map(c => r[c.key] ?? '').join(','))
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}

onMounted(fetchStocks)
</script>
