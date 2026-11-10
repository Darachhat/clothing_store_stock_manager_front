<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-ink tracking-tight">Purchases Report</h2>
        <p class="text-xs text-ink-tertiary mt-0.5">Procurement cost breakdown by period</p>
      </div>
      <AppButton variant="default" @click="exportCsv">Export CSV</AppButton>
    </div>

    <!-- Filters -->
    <AppCard>
      <div class="flex items-end gap-3 flex-wrap">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-secondary">From</label>
          <input v-model="fromDate" type="date" class="px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-secondary">To</label>
          <input v-model="toDate" type="date" class="px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-secondary">Group By</label>
          <AppSelect v-model="groupBy" :options="groupByOptions" class="w-32" />
        </div>
        <AppButton variant="primary" :loading="loading" @click="fetchReport">Run Report</AppButton>
      </div>
    </AppCard>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      <AppCard>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary mb-1">Total Cost</p>
        <p class="text-2xl font-bold text-ink tracking-tight m-0">${{ summary.totalCost }}</p>
      </AppCard>
      <AppCard>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary mb-1">Orders</p>
        <p class="text-2xl font-bold text-ink tracking-tight m-0">{{ summary.orders }}</p>
      </AppCard>
      <AppCard>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary mb-1">Items Purchased</p>
        <p class="text-2xl font-bold text-ink tracking-tight m-0">{{ summary.items }}</p>
      </AppCard>
      <AppCard>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary mb-1">Avg. Order Cost</p>
        <p class="text-2xl font-bold text-ink tracking-tight m-0">${{ summary.avgCost }}</p>
      </AppCard>
    </div>

    <!-- Data Table -->
    <AppCard :no-pad="true">
      <AppTable :columns="columns" :rows="rows" :loading="loading" empty-text="Run a report to see data.">
        <template #cell-total_cost="{ value }">
          <span class="font-semibold text-brand-900">${{ Number(value).toFixed(2) }}</span>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Purchases Report — Clothing Store' })

const { getPurchasesReport } = useReportApi()
const { addToast } = useAppToast()

const loading = ref(false)
const rows = ref<any[]>([])
const fromDate = ref(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
const toDate = ref(new Date().toISOString().slice(0, 10))
const groupBy = ref('day')

const groupByOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
]

const summary = computed(() => {
  if (!rows.value.length) return { totalCost: '0.00', orders: 0, items: 0, avgCost: '0.00' }
  const cost = rows.value.reduce((a, r) => a + Number(r.total_cost ?? 0), 0)
  const orders = rows.value.reduce((a, r) => a + Number(r.order_count ?? 0), 0)
  const items = rows.value.reduce((a, r) => a + Number(r.items_received ?? 0), 0)
  return {
    totalCost: cost.toFixed(2),
    orders,
    items,
    avgCost: orders > 0 ? (cost / orders).toFixed(2) : '0.00',
  }
})

const columns = [
  { key: 'period', label: 'Period' },
  { key: 'order_count', label: 'Orders' },
  { key: 'items_received', label: 'Items Received' },
  { key: 'total_cost', label: 'Total Cost' },
]

async function fetchReport() {
  loading.value = true
  try {
    const data = await getPurchasesReport({ from_date: fromDate.value, to_date: toDate.value, group_by: groupBy.value }) as any
    rows.value = Array.isArray(data) ? data : (data?.rows ?? [])
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  if (!rows.value.length) return
  const headers = columns.map(c => c.label)
  const lines = rows.value.map(r => columns.map(c => r[c.key] ?? '').join(','))
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `purchases-report-${fromDate.value}-to-${toDate.value}.csv`
  link.click()
}

onMounted(fetchReport)
</script>
