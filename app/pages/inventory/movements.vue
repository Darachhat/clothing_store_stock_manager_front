<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Inventory Movements</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Complete audit trail of all stock changes</p>
      </div>
    </div>

    <!-- Filters -->
    <AppCard>
      <div class="flex gap-3 flex-wrap">
        <AppSelect
          v-model="movementType"
          :options="typeOptions"
          placeholder="All Types"
          class="w-48"
          @update:model-value="fetchMovements"
        />
        <AppButton variant="ghost" @click="fetchMovements">Refresh</AppButton>
      </div>
    </AppCard>

    <!-- Movements Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="movements"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-arrows-right-left', label: 'No movements recorded' }"
      >
        <template #cell-movement_type="{ row }">
          <AppBadge :color="getTypeColor(row.movement_type)" :label="row.movement_type" size="sm" variant="subtle" />
        </template>

        <template #cell-quantity="{ row }">
          <span
            class="font-bold"
            :class="row.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ row.quantity > 0 ? '+' : '' }}{{ row.quantity }}
          </span>
        </template>

        <template #cell-before_quantity="{ row }">
          <span class="text-gray-500 font-mono text-sm">{{ row.before_quantity }} → {{ row.after_quantity }}</span>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-sm text-gray-500">{{ new Date(row.created_at).toLocaleString() }}</span>
        </template>
      </AppTable>

      <div class="flex justify-between items-center mt-4 px-1">
        <span class="text-xs text-gray-500">Showing {{ movements.length }} records</span>
        <div class="flex gap-2">
          <AppButton size="sm" variant="ghost" :disabled="page <= 1" @click="prevPage">Previous</AppButton>
          <AppButton size="sm" variant="ghost" @click="nextPage">Next</AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const invApi = useInventoryApi()
const toast = useAppToast()

const loading = ref(false)
const movements = ref<any[]>([])
const movementType = ref('')
const page = ref(1)
const perPage = 50

const typeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Sale', value: 'SALE' },
  { label: 'Return', value: 'RETURN' },
  { label: 'Purchase', value: 'PURCHASE' },
  { label: 'Adjustment', value: 'ADJUSTMENT' },
  { label: 'Transfer In', value: 'TRANSFER_IN' },
  { label: 'Transfer Out', value: 'TRANSFER_OUT' },
]

const columns = [
  { key: 'movement_type', label: 'Type' },
  { key: 'quantity', label: 'Change' },
  { key: 'before_quantity', label: 'Stock Before → After' },
  { key: 'reference_type', label: 'Reference' },
  { key: 'note', label: 'Notes' },
  { key: 'created_at', label: 'Date/Time' },
]

function getTypeColor(type: string) {
  switch (type) {
    case 'SALE': return 'blue'
    case 'RETURN': return 'amber'
    case 'PURCHASE': return 'emerald'
    case 'ADJUSTMENT': return 'purple'
    case 'TRANSFER_IN': return 'cyan'
    case 'TRANSFER_OUT': return 'orange'
    default: return 'gray'
  }
}

async function fetchMovements() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      skip: (page.value - 1) * perPage,
      limit: perPage,
    }
    if (movementType.value) params.movement_type = movementType.value
    const data = await invApi.listMovements(params) as any[]
    movements.value = data
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function prevPage() {
  if (page.value > 1) { page.value--; await fetchMovements() }
}

async function nextPage() {
  page.value++
  await fetchMovements()
}

onMounted(fetchMovements)
</script>
