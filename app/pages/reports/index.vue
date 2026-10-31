<template>
  <div class="space-y-6">
    <!-- Header with period buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Business Analytics & Reports</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Financial performance, gross profit, and stock health</p>
      </div>

      <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        <button
          v-for="p in periods"
          :key="p.value"
          class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
          :class="period === p.value ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'"
          @click="selectPeriod(p.value)"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Top KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AppCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</p>
          <div class="p-2 bg-primary-50 dark:bg-primary-950/40 rounded-lg">
            
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          ${{ Number(stats?.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </p>
        <p class="text-xs text-gray-400 mt-1">Total revenue collected</p>
      </AppCard>

      <AppCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Profit</p>
          <div class="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
            
          </div>
        </div>
        <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
          ${{ Number(stats?.gross_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </p>
        <p class="text-xs text-gray-400 mt-1">Margin: {{ Number(stats?.profit_margin || 0).toFixed(1) }}%</p>
      </AppCard>

      <AppCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders / Transactions</p>
          <div class="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
            
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          {{ stats?.order_count || 0 }}
        </p>
        <p class="text-xs text-gray-400 mt-1">Avg Ticket: ${{ Number(stats?.average_order_value || 0).toFixed(2) }}</p>
      </AppCard>

      <AppCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock Variants</p>
          <div class="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
            
          </div>
        </div>
        <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
          {{ stats?.low_stock_count || 0 }}
        </p>
        <NuxtLink to="/inventory" class="text-xs text-amber-600 hover:underline mt-1 block">
          Review stock alerts &rarr;
        </NuxtLink>
      </AppCard>
    </div>

    <!-- Payment Methods & Top Products -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Payment Methods Distribution -->
      <AppCard>
        <template #header>
          <h3 class="font-semibold text-base">Payment Method Breakdown</h3>
        </template>

        <div v-if="stats?.payment_breakdown?.length" class="space-y-3">
          <div
            v-for="pm in stats.payment_breakdown"
            :key="pm.method"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60"
          >
            <div class="flex items-center gap-3">
              <div class="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
              <span class="font-medium text-sm text-gray-800 dark:text-gray-200">{{ pm.method }}</span>
            </div>
            <div class="text-right">
              <span class="font-semibold text-sm">${{ Number(pm.total).toFixed(2) }}</span>
              <span class="text-xs text-gray-400 ml-2">({{ pm.count }} txns)</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-sm text-gray-400">
          No payment transactions for this period
        </div>
      </AppCard>

      <!-- Top Selling Products -->
      <AppCard>
        <template #header>
          <h3 class="font-semibold text-base">Top Selling Products</h3>
        </template>

        <div v-if="stats?.top_products?.length" class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="(prod, idx) in stats.top_products"
            :key="prod.variant_id"
            class="py-2.5 flex items-center justify-between text-sm"
          >
            <div class="flex items-center gap-3">
              <span class="w-5 text-xs font-bold text-gray-400">#{{ Number(idx) + 1 }}</span>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ prod.name }}</p>
                <p class="text-xs text-gray-400">{{ prod.sku }} • {{ prod.color }} / {{ prod.size }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold text-gray-900 dark:text-white">${{ Number(prod.revenue).toFixed(2) }}</p>
              <p class="text-xs text-gray-400">{{ prod.quantity }} sold</p>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-sm text-gray-400">
          No sales recorded for this period
        </div>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

useHead({ title: 'Reports — Clothing Store' })

const { getDashboard } = useReportApi()
const { addToast } = useAppToast()

const period = ref('today')
const loading = ref(false)
const stats = ref<any>(null)

const periods = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: 'This Month', value: 'this_month' },
]

function selectPeriod(val: string) {
  period.value = val
  fetchDashboard()
}

async function fetchDashboard() {
  loading.value = true
  try {
    const res: any = await getDashboard(period.value)
    stats.value = res || {}
  } catch (err: any) {
    addToast({
      type: 'error',
      title: 'Failed to load report data',
      message: err?.data?.detail || err.message,
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>
