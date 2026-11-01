<template>
  <div style="display:flex; flex-direction:column; gap:24px;">
    <!-- Header row -->
    <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
      <div>
        <h2 style="font-size:18px; font-weight:600; color:var(--text-primary); letter-spacing:-0.01em;">Warehouse & Stock Operations</h2>
        <p style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">Real-time stock health, low-stock alerts, and warehouse workflows.</p>
      </div>
      <AppSelect
        v-model="period"
        :options="periodOptions"
        style="width:140px;"
        @change="loadDashboard"
      />
    </div>

    <!-- KPI Cards -->
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px;">
      <div
        v-for="kpi in kpiCards"
        :key="kpi.label"
        style="background:var(--surface-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px; display:flex; flex-direction:column; gap:12px;"
      >
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <span style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.06em;">{{ kpi.label }}</span>
          <div style="width:28px; height:28px; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; color:var(--text-secondary);">
            <UIcon :name="kpi.icon" class="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div style="font-size:22px; font-weight:700; color:var(--text-primary); letter-spacing:-0.02em; font-family:var(--font-mono);">{{ kpi.value }}</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">{{ kpi.sublabel }}</div>
        </div>
      </div>
    </div>

    <!-- Lower row: Low Stock Alert + Warehouse Quick Actions -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
      <!-- Low Stock -->
      <div style="background:var(--surface-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <p style="font-size:12px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.06em;">Low Stock Alert</p>
          <span
            :style="`font-size:11px; font-weight:600; padding:2px 8px; border-radius:4px; ${
              (dashboard?.low_stock_count ?? 0) > 0
                ? 'background:var(--status-amber-bg); color:var(--status-amber);'
                : 'background:var(--status-green-bg); color:var(--status-green);'
            }`"
          >
            {{ (dashboard?.low_stock_count ?? 0) > 0 ? `${dashboard?.low_stock_count} items` : 'All good' }}
          </span>
        </div>
        <p style="font-size:13px; color:var(--text-secondary); line-height:1.5;">
          {{ dashboard?.low_stock_count ?? 0 }} variant{{ (dashboard?.low_stock_count ?? 0) !== 1 ? 's are' : ' is' }} at or below reorder level across active warehouses.
        </p>
        <NuxtLink
          to="/inventory"
          style="display:inline-flex; align-items:center; gap:6px; margin-top:12px; font-size:12px; font-weight:600; color:var(--status-amber); text-decoration:none;"
        >
          Review stock levels
          <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
        </NuxtLink>
      </div>

      <!-- Quick Actions -->
      <div style="background:var(--surface-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px;">
        <p style="font-size:12px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:16px;">Warehouse Quick Actions</p>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <AppButton
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            variant="default"
            size="sm"
            style="justify-content:flex-start; width:100%;"
          >
            {{ action.label }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface WarehouseDashboard {
  period: string
  total_sku_count: number
  total_units: number
  low_stock_count: number
  out_of_stock_count: number
  units_in: number
  units_out: number
  open_transfers: number
}

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Stock Dashboard — Clothing Store' })

const { getWarehouseDashboard } = useReportApi()
const authStore = useAuthStore()

const period = ref('today')
const dashboard = ref<WarehouseDashboard | null>(null)

const periodOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Month', value: 'this_month' },
]

const kpiCards = computed(() => [
  {
    label: 'Low Stock Alerts',
    value: dashboard.value?.low_stock_count ?? 0,
    sublabel: 'variants at or below reorder level',
    icon: 'i-heroicons-exclamation-triangle',
  },
  {
    label: 'Out of Stock',
    value: dashboard.value?.out_of_stock_count ?? 0,
    sublabel: 'variants with zero units',
    icon: 'i-heroicons-x-circle',
  },
  {
    label: 'Units On Hand',
    value: fmtInt(dashboard.value?.total_units ?? 0),
    sublabel: `${fmtInt(dashboard.value?.total_sku_count ?? 0)} stock records`,
    icon: 'i-heroicons-cube',
  },
  {
    label: 'Units In',
    value: fmtInt(dashboard.value?.units_in ?? 0),
    sublabel: 'received / added in period',
    icon: 'i-heroicons-arrow-down-tray',
  },
  {
    label: 'Units Out',
    value: fmtInt(dashboard.value?.units_out ?? 0),
    sublabel: 'sold / removed in period',
    icon: 'i-heroicons-arrow-up-tray',
  },
  {
    label: 'Open Transfers',
    value: dashboard.value?.open_transfers ?? 0,
    sublabel: 'pending or in transit',
    icon: 'i-heroicons-truck',
  },
])

const allQuickActions = [
  { label: 'Adjust Stock Levels', to: '/inventory/adjustments', icon: 'i-heroicons-adjustments-horizontal', perm: 'inventory.adjust' },
  { label: 'Inter-Warehouse Transfer', to: '/inventory/transfers', icon: 'i-heroicons-truck', perm: 'inventory.transfer' },
  { label: 'New Purchase Order', to: '/purchases/new', icon: 'i-heroicons-document-text', perm: 'purchase.create' },
  { label: 'Add Product / Variant', to: '/products/new', icon: 'i-heroicons-plus', perm: 'product.create' },
  { label: 'Print Barcode / QR Labels', to: '/labels/generate', icon: 'i-heroicons-qr-code', perm: 'product.read' },
]

// Only offer actions the signed-in user is actually allowed to perform
const quickActions = computed(() => allQuickActions.filter((a) => authStore.hasPermission(a.perm)))

function fmtInt(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

async function loadDashboard() {
  try {
    dashboard.value = await getWarehouseDashboard(period.value) as WarehouseDashboard
  } catch (err) {
    console.error(err)
  }
}

onMounted(loadDashboard)
</script>
