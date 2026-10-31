<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Stock Transfers</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Move inventory between warehouses and branches</p>
      </div>
      <AppButton label="New Transfer" variant="primary" @click="openCreateModal" />
    </div>

    <!-- Transfers Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="transfers"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-truck', label: 'No transfers found' }"
      >
        <template #cell-transfer_number="{ row }">
          <span class="font-mono font-medium text-primary-600 dark:text-primary-400">{{ row.transfer_number }}</span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="getStatusColor(row.status)" :label="row.status" size="sm" variant="subtle" />
        </template>

        <template #cell-actions="{ row }">
          <div class="flex gap-1">
            <AppButton
              v-if="row.status === 'PENDING'"
              size="sm" color="blue" variant="default" label="Approve"
              @click="approveTransfer(row.id)"
            />
            <AppButton
              v-if="row.status === 'APPROVED'"
              size="sm" color="amber" variant="default" label="Dispatch"
              @click="dispatchTransfer(row.id)"
            />
            <AppButton
              v-if="row.status === 'IN_TRANSIT'"
              size="sm" color="emerald" variant="default" label="Receive"
              @click="receiveTransfer(row.id)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create Transfer Modal -->
    <AppModal v-model="showModal" :ui="{ width: 'sm:max-w-xl' }">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Create Stock Transfer</h3>
            <AppButton variant="ghost" size="sm" @click="showModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleCreate">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From Warehouse *</label>
              <select v-model="form.from_warehouse_id" required class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                <option value="" disabled>Select source</option>
                <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To Warehouse *</label>
              <select v-model="form.to_warehouse_id" required class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                <option value="" disabled>Select destination</option>
                <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Items *</label>
              <AppButton size="sm" variant="default" label="Add Item" @click="addItem" />
            </div>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              <div v-for="(item, idx) in form.items" :key="idx" class="flex gap-2 items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                <select v-model="item.variant_id" required class="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs">
                  <option value="" disabled>Select SKU</option>
                  <option v-for="v in variants" :key="v.id" :value="v.id">{{ v.sku }}</option>
                </select>
                <input v-model.number="item.quantity" type="number" min="1" required placeholder="Qty"
                  class="w-20 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs" />
                <AppButton variant="danger" size="sm" @click="form.items.splice(idx, 1)" />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <input v-model="form.notes" type="text" placeholder="Transfer reason or reference"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showModal = false" />
            <AppButton type="submit" variant="primary" label="Create Transfer" :loading="saving" />
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
const transfers = ref<any[]>([])
const warehouses = ref<any[]>([])
const variants = ref<any[]>([])
const showModal = ref(false)

const form = ref({
  from_warehouse_id: '',
  to_warehouse_id: '',
  notes: '',
  items: [{ variant_id: '', quantity: 1 }] as any[],
})

const columns = [
  { key: 'transfer_number', label: 'Transfer #' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Notes' },
  { key: 'created_at', label: 'Created', format: (v: string) => new Date(v).toLocaleDateString() },
  { key: 'actions', label: 'Actions' },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING': return 'gray'
    case 'APPROVED': return 'blue'
    case 'IN_TRANSIT': return 'amber'
    case 'COMPLETED': return 'emerald'
    case 'CANCELLED': return 'red'
    default: return 'gray'
  }
}

function addItem() {
  form.value.items.push({ variant_id: variants.value[0]?.id || '', quantity: 1 })
}

function openCreateModal() {
  form.value = {
    from_warehouse_id: warehouses.value[0]?.id || '',
    to_warehouse_id: warehouses.value[1]?.id || '',
    notes: '',
    items: [{ variant_id: variants.value[0]?.id || '', quantity: 1 }],
  }
  showModal.value = true
}

async function fetchTransfers() {
  loading.value = true
  try {
    const data = await invApi.listTransfers({ limit: 50 }) as any[]
    transfers.value = data
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

async function handleCreate() {
  saving.value = true
  try {
    await invApi.createTransfer({
      from_warehouse_id: form.value.from_warehouse_id,
      to_warehouse_id: form.value.to_warehouse_id,
      notes: form.value.notes,
      items: form.value.items,
    })
    toast.add({ title: 'Success', description: 'Transfer created', color: 'green' })
    showModal.value = false
    await fetchTransfers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function approveTransfer(id: string) {
  try {
    await invApi.approveTransfer(id)
    toast.add({ title: 'Approved', description: 'Transfer approved', color: 'green' })
    await fetchTransfers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  }
}

async function dispatchTransfer(id: string) {
  try {
    await invApi.dispatchTransfer(id)
    toast.add({ title: 'Dispatched', description: 'Transfer dispatched', color: 'amber' })
    await fetchTransfers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  }
}

async function receiveTransfer(id: string) {
  try {
    await invApi.receiveTransfer(id)
    toast.add({ title: 'Received', description: 'Transfer completed, stock updated!', color: 'green' })
    await fetchTransfers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  }
}

onMounted(async () => {
  await fetchMeta()
  await fetchTransfers()
})
</script>
