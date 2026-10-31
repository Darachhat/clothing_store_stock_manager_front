<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Stock Adjustments</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Correct inventory counts and record discrepancies</p>
      </div>
      <AppButton label="New Adjustment" variant="primary" @click="openModal" />
    </div>

    <!-- Recent Adjustments table (movements filtered by ADJUSTMENT type) -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="adjustments"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-adjustments-horizontal', label: 'No adjustments recorded' }"
      >
        <template #cell-quantity="{ row }">
          <span
            class="font-bold"
            :class="row.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ row.quantity > 0 ? '+' : '' }}{{ row.quantity }}
          </span>
        </template>

        <template #cell-stock_change="{ row }">
          <span class="font-mono text-xs text-gray-500">{{ row.before_quantity }} → {{ row.after_quantity }}</span>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-sm text-gray-500">{{ new Date(row.created_at).toLocaleString() }}</span>
        </template>
      </AppTable>
    </AppCard>

    <!-- Adjustment Modal -->
    <AppModal v-model="showModal">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Record Stock Adjustment</h3>
            <AppButton variant="ghost" size="sm" @click="showModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product Variant (SKU) *</label>
            <select v-model="form.variant_id" required class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              <option value="" disabled>Select variant</option>
              <option v-for="v in variants" :key="v.id" :value="v.id">{{ v.sku }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Warehouse *</label>
            <select v-model="form.warehouse_id" required class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              <option value="" disabled>Select warehouse</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Adjustment Type *</label>
            <div class="flex gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.type" type="radio" value="add" class="text-emerald-600" />
                <span class="text-sm text-emerald-600 font-medium">+ Add Stock</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.type" type="radio" value="remove" class="text-red-600" />
                <span class="text-sm text-red-600 font-medium">- Remove Stock</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.type" type="radio" value="set" class="text-blue-600" />
                <span class="text-sm text-blue-600 font-medium">= Set to Value</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ form.type === 'set' ? 'New Stock Count *' : 'Quantity *' }}
            </label>
            <input v-model.number="form.quantity" type="number" min="0" required
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Reason / Notes *</label>
            <textarea v-model="form.note" rows="2" required placeholder="e.g. Physical count discrepancy, damaged goods, theft..."
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showModal = false" />
            <AppButton type="submit" variant="primary" label="Submit Adjustment" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const invApi = useInventoryApi()
const variantApi = useVariantApi()
const branchApi = useBranchApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const adjustments = ref<any[]>([])
const variants = ref<any[]>([])
const warehouses = ref<any[]>([])
const showModal = ref(false)

const form = ref({
  variant_id: '',
  warehouse_id: '',
  type: 'add',
  quantity: 1,
  note: '',
})

const columns = [
  { key: 'quantity', label: 'Change' },
  { key: 'stock_change', label: 'Before → After' },
  { key: 'note', label: 'Reason' },
  { key: 'reference_type', label: 'Reference' },
  { key: 'created_at', label: 'Date/Time' },
]

function openModal() {
  form.value = {
    variant_id: variants.value[0]?.id || '',
    warehouse_id: warehouses.value[0]?.id || '',
    type: 'add',
    quantity: 1,
    note: '',
  }
  showModal.value = true
}

async function fetchAdjustments() {
  loading.value = true
  try {
    const data = await invApi.listMovements({ movement_type: 'ADJUSTMENT', limit: 50 }) as any[]
    adjustments.value = data
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function fetchMeta() {
  try {
    const [stocks, vars, branches] = await Promise.all([
      invApi.listStocks({}) as any,
      variantApi.listVariants({ limit: 500 }) as any,
      branchApi.listBranches().catch(() => []),
    ])
    const wMap = new Map()
    ;(branches || []).forEach((b: any) => {
      ;(b.warehouses || []).forEach((w: any) => {
        wMap.set(w.id, { id: w.id, name: `${b.name} — ${w.name}` })
      })
    })
    ;(stocks as any[]).forEach((s: any) => {
      if (!wMap.has(s.warehouse_id)) wMap.set(s.warehouse_id, { id: s.warehouse_id, name: `Warehouse ${s.warehouse_id.slice(0, 8)}` })
    })
    warehouses.value = Array.from(wMap.values())
    variants.value = vars || []
  } catch (e) { console.error(e) }
}

async function handleSubmit() {
  saving.value = true
  try {
    let delta = form.value.quantity
    let movement_type = 'ADJUSTMENT'

    if (form.value.type === 'remove') delta = -Math.abs(form.value.quantity)
    else if (form.value.type === 'add') delta = Math.abs(form.value.quantity)

    await invApi.createAdjustment({
      variant_id: form.value.variant_id,
      warehouse_id: form.value.warehouse_id,
      quantity_delta: form.value.type === 'set' ? null : delta,
      new_quantity: form.value.type === 'set' ? form.value.quantity : null,
      movement_type,
      note: form.value.note,
    })
    toast.add({ title: 'Success', description: 'Stock adjustment recorded', color: 'green' })
    showModal.value = false
    await fetchAdjustments()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchMeta()
  await fetchAdjustments()
})
</script>
