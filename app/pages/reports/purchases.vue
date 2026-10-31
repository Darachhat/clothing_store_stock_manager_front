<template>
  <div class="page-root">
    <div class="page-header">
      <div>
        <h2 class="page-title">Purchases Report</h2>
        <p class="page-subtitle">Procurement cost breakdown by period</p>
      </div>
      <AppButton variant="default" @click="exportCsv">Export CSV</AppButton>
    </div>

    <!-- Filters -->
    <AppCard>
      <div class="filter-bar">
        <div class="form-field">
          <label class="field-label">From</label>
          <input v-model="fromDate" type="date" class="field-input" />
        </div>
        <div class="form-field">
          <label class="field-label">To</label>
          <input v-model="toDate" type="date" class="field-input" />
        </div>
        <div class="form-field">
          <label class="field-label">Group By</label>
          <AppSelect v-model="groupBy" :options="groupByOptions" style="width:130px;" />
        </div>
        <AppButton variant="primary" :loading="loading" @click="fetchReport">Run Report</AppButton>
      </div>
    </AppCard>

    <!-- KPIs -->
    <div class="kpi-grid">
      <AppCard>
        <p class="kpi-label">Total Cost</p>
        <p class="kpi-value">${{ summary.totalCost }}</p>
      </AppCard>
      <AppCard>
        <p class="kpi-label">Orders</p>
        <p class="kpi-value">{{ summary.orders }}</p>
      </AppCard>
      <AppCard>
        <p class="kpi-label">Items Purchased</p>
        <p class="kpi-value">{{ summary.items }}</p>
      </AppCard>
      <AppCard>
        <p class="kpi-label">Avg. Order Cost</p>
        <p class="kpi-value">${{ summary.avgCost }}</p>
      </AppCard>
    </div>

    <!-- Data Table -->
    <AppCard :no-pad="true">
      <AppTable :columns="columns" :rows="rows" :loading="loading" empty-text="Run a report to see data.">
        <template #cell-total_cost="{ value }">
          <span class="cost-value">${{ Number(value).toFixed(2) }}</span>
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

<style scoped>
.page-root { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
.page-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }

.filter-bar { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.field-input { padding: 8px 10px; font-size: 13px; background: var(--surface-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); outline: none; transition: border-color .15s; }
.field-input:focus { border-color: var(--color-primary); }

.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (max-width: 768px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .kpi-grid { grid-template-columns: 1fr; } }

.kpi-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); margin-bottom: 4px; }
.kpi-value { font-size: 24px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; }

.cost-value { font-weight: 600; color: var(--color-primary, #6366f1); }
</style>
