<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Inventory Management</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Track stock levels across warehouses and branches</p>
      </div>
      <div class="flex gap-2">
        <AppButton
          to="/labels/generate"
          label="Print Barcodes"
          variant="default" 
        />
        <AppButton
          label="Stock Adjustment"
          variant="primary"
          @click="openAdjustModal"
        />
      </div>
    </div>

    <!-- Filters -->
    <AppCard>
      <div class="flex gap-3 flex-wrap">
        <AppInput
          v-model="search"
          placeholder="Search by SKU, product name..."
          class="flex-1 min-w-48"
        />
        <AppSelect
          v-model="lowStockOnly"
          :options="[
            { label: 'All Stock Levels', value: false },
            { label: 'Low Stock Alerts Only', value: true }
          ]"
          class="w-48"
        />
      </div>
    </AppCard>

    <!-- Stock Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="filteredStocks"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-archive-box', label: 'No inventory records found' }"
      >
        <template #cell-sku="{ row }">
          <span class="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
            {{ row.sku || row.variant?.sku || '-' }}
          </span>
        </template>

        <template #cell-quantity="{ row }">
          <span
            class="font-bold text-sm"
            :class="row.quantity <= (row.reorder_level || 5) ? 'text-red-500' : 'text-gray-900 dark:text-white'"
          >
            {{ row.quantity }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            v-if="row.quantity <= 0"
            color="red"
            label="Out of Stock"
            size="sm"
          />
          <AppBadge
            v-else-if="row.quantity <= (row.reorder_level || 5)"
            color="amber"
            label="Low Stock"
            size="sm"
          />
          <AppBadge
            v-else
            color="green"
            label="In Stock"
            size="sm"
          />
        </template>

        <template #cell-actions="{ row }">
          <AppButton
            size="sm"
            variant="primary" 
            label="Adjust"
            @click="openQuickAdjust(row)"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- Adjustment Modal -->
    <AppModal v-model="isAdjustOpen">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Stock Adjustment</h3>
            <AppButton variant="ghost" @click="isAdjustOpen = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="submitAdjustment">
          <div class="form-field"><label class="form-label">Variant ID</label>
            <AppInput v-model="adjustForm.variantId" placeholder="Variant UUID" required />
          </div>

          <div class="form-field"><label class="form-label">Warehouse ID</label>
            <AppInput v-model="adjustForm.warehouseId" placeholder="Warehouse UUID" required />
          </div>

          <div class="form-field"><label class="form-label">Quantity Delta (+ to add, - to subtract)</label>
            <AppInput v-model.number="adjustForm.quantityDelta" type="number" placeholder="e.g. +10 or -2" required />
          </div>

          <div class="form-field"><label class="form-label">Reason</label>
            <AppSelect
              v-model="adjustForm.reason"
              :options="['PHYSICAL_COUNT', 'DAMAGED', 'LOST', 'RETURN_RESTOCK', 'INITIAL_COUNT']"
            />
          </div>

          <div class="form-field"><label class="form-label">Notes</label>
            <AppInput v-model="adjustForm.notes" placeholder="Optional notes" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" @click="isAdjustOpen = false">Cancel</AppButton>
            <AppButton type="submit" variant="primary" :loading="isSubmitting">Apply Adjustment</AppButton>
          </div>
        </form>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const invApi = useInventoryApi()
const toast = useAppToast()

const loading = ref(false)
const isSubmitting = ref(false)
const search = ref('')
const lowStockOnly = ref(false)
const stocks = ref<any[]>([])

const isAdjustOpen = ref(false)
const adjustForm = reactive({
  variantId: '',
  warehouseId: '',
  quantityDelta: 0,
  reason: 'PHYSICAL_COUNT',
  notes: '',
})

const columns = [
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'warehouse_id', label: 'Warehouse ID' },
  { key: 'quantity', label: 'Quantity', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const filteredStocks = computed(() => {
  return stocks.value.filter(s => {
    if (lowStockOnly.value && s.quantity > (s.reorder_level || 5)) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      const sku = (s.sku || s.variant?.sku || '').toLowerCase()
      return sku.includes(q)
    }
    return true
  })
})

async function fetchInventory() {
  loading.value = true
  try {
    const res: any = await invApi.listStocks({ limit: 100 })
    stocks.value = res || []
  } catch (err: any) {
    toast.add({
      title: 'Failed to load inventory',
      description: err?.data?.detail || err.message,
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

function openAdjustModal() {
  adjustForm.variantId = ''
  adjustForm.warehouseId = ''
  adjustForm.quantityDelta = 0
  adjustForm.reason = 'PHYSICAL_COUNT'
  adjustForm.notes = ''
  isAdjustOpen.value = true
}

function openQuickAdjust(row: any) {
  adjustForm.variantId = row.variant_id
  adjustForm.warehouseId = row.warehouse_id
  adjustForm.quantityDelta = 0
  adjustForm.reason = 'PHYSICAL_COUNT'
  adjustForm.notes = ''
  isAdjustOpen.value = true
}

async function submitAdjustment() {
  if (!adjustForm.variantId || !adjustForm.warehouseId || adjustForm.quantityDelta === 0) {
    toast.add({ title: 'Please fill all required fields', color: 'amber' })
    return
  }
  isSubmitting.value = true
  try {
    await invApi.createAdjustment({
      variant_id: adjustForm.variantId,
      warehouse_id: adjustForm.warehouseId,
      quantity_delta: adjustForm.quantityDelta,
      movement_type: adjustForm.reason || 'ADJUSTMENT',
      note: adjustForm.notes || undefined,
    })
    toast.add({ title: 'Stock adjusted successfully', color: 'green' })
    isAdjustOpen.value = false
    fetchInventory()
  } catch (err: any) {
    toast.add({
      title: 'Adjustment failed',
      description: err?.data?.detail || err.message,
      color: 'red',
    })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchInventory()
})
</script>
