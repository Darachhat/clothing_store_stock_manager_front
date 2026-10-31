<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Purchase Orders</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage procurement, orders and goods receipts</p>
      </div>
      <AppButton
        label="New Purchase Order"
        variant="primary"
        to="/purchases/new"
      />
    </div>

    <!-- Filters -->
    <AppCard>
      <div class="flex gap-3 flex-wrap">
        <AppSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="All Statuses"
          class="w-48"
          @update:model-value="fetchOrders"
        />
        <AppButton variant="ghost" @click="fetchOrders">
          Refresh
        </AppButton>
      </div>
    </AppCard>

    <!-- Orders Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="orders"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-document-text', label: 'No purchase orders found' }"
      >
        <template #cell-po_number="{ row }">
          <span class="font-mono font-medium text-primary-600 dark:text-primary-400">
            {{ row.po_number }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="getStatusColor(row.status)"
            :label="row.status"
            size="sm"
            variant="subtle"
          />
        </template>

        <template #cell-total="{ row }">
          <span class="font-semibold text-gray-900 dark:text-white">
            ${{ Number(row.total).toFixed(2) }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <AppButton
              v-if="row.status === 'DRAFT'"
              size="sm"
              color="emerald"
              variant="default"
              label="Approve"
              @click="approveOrder(row)"
            />
            <AppButton
              v-if="row.status === 'ORDERED' || row.status === 'PARTIAL'"
              size="sm"
              variant="primary"
              label="Receive Goods"
              @click="openReceiveModal(row)"
            />
            <AppButton
              size="sm"
              variant="ghost"
              label="Details"
              :to="`/purchases/${row.id}`"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create PO Modal -->
    <AppModal v-model="showCreateModal" :ui="{ width: 'sm:max-w-2xl' }">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Create Purchase Order</h3>
            <AppButton variant="ghost" size="sm" @click="showCreateModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleCreateOrder">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier *</label>
              <select
                v-model="createForm.supplier_id"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="" disabled>Select supplier</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Date</label>
              <input
                v-model="createForm.expected_date"
                type="date"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Order Items *</label>
              <AppButton size="sm" variant="default" label="Add Item" @click="addItemRow" />
            </div>

            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="(item, idx) in createForm.items"
                :key="idx"
                class="flex gap-2 items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg"
              >
                <select
                  v-model="item.variant_id"
                  required
                  class="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs"
                >
                  <option value="" disabled>Select Variant (SKU)</option>
                  <option v-for="v in variants" :key="v.id" :value="v.id">
                    {{ v.sku }} - {{ v.product?.name }} (Cost: ${{ v.cost_price }})
                  </option>
                </select>
                <input
                  v-model.number="item.quantity_ordered"
                  type="number"
                  min="1"
                  required
                  placeholder="Qty"
                  class="w-20 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs"
                />
                <input
                  v-model.number="item.unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Unit Cost"
                  class="w-24 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs"
                />
                <AppButton
                  variant="danger"
                  size="sm"
                  @click="removeItemRow(idx)"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              v-model="createForm.notes"
              rows="2"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              placeholder="Delivery instructions or internal notes"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showCreateModal = false" />
            <AppButton type="submit" variant="primary" label="Create Order" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>

    <!-- Receive Goods Modal -->
    <AppModal v-model="showReceiveModal" :ui="{ width: 'sm:max-w-2xl' }">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Receive Goods: {{ selectedOrder?.po_number }}</h3>
            <AppButton variant="ghost" size="sm" @click="showReceiveModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleReceiveGoods">
          <p class="text-xs text-gray-500">
            Enter the actual quantities received for each line item. Receiving goods will automatically update warehouse stock levels.
          </p>

          <div class="space-y-3">
            <div
              v-for="item in receiveItems"
              :key="item.purchase_item_id"
              class="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg"
            >
              <div>
                <p class="font-medium text-sm text-gray-900 dark:text-white">
                  SKU: {{ getVariantSku(item.variant_id) }}
                </p>
                <p class="text-xs text-gray-500">
                  Ordered: {{ item.quantity_ordered }} | Previously Received: {{ item.quantity_received }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Receive Now:</label>
                <input
                  v-model.number="item.receive_now"
                  type="number"
                  min="0"
                  :max="item.quantity_ordered - item.quantity_received"
                  class="w-24 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt Notes</label>
            <input
              v-model="receiveNotes"
              type="text"
              placeholder="e.g. Received in good condition, batch #1"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showReceiveModal = false" />
            <AppButton type="submit" variant="primary" label="Complete Receipt" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>

    <!-- Details Modal -->
    <AppModal v-model="showDetailsModal" :ui="{ width: 'sm:max-w-2xl' }">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">PO Details: {{ selectedOrder?.po_number }}</h3>
            <AppButton variant="ghost" size="sm" @click="showDetailsModal = false" />
          </div>
        </template>

        <div v-if="selectedOrder" class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Status:</span>
              <AppBadge :color="getStatusColor(selectedOrder.status)" :label="selectedOrder.status" size="sm" class="ml-2" />
            </div>
            <div>
              <span class="text-gray-500">Total:</span>
              <span class="font-bold ml-2">${{ Number(selectedOrder.total).toFixed(2) }}</span>
            </div>
          </div>

          <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Order Items</h4>
            <div class="space-y-2">
              <div
                v-for="item in selectedOrder.items"
                :key="item.id"
                class="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-xs"
              >
                <div>
                  <span class="font-mono font-medium">{{ getVariantSku(item.variant_id) }}</span>
                  <span class="text-gray-500 ml-2">Ordered: {{ item.quantity_ordered }} | Received: {{ item.quantity_received }}</span>
                </div>
                <div class="font-medium">
                  ${{ Number(item.subtotal).toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
const purchaseApi = usePurchaseApi()
const supplierApi = useSupplierApi()
const variantApi = useVariantApi()
const invApi = useInventoryApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const orders = ref<any[]>([])
const suppliers = ref<any[]>([])
const variants = ref<any[]>([])
const defaultBranchId = ref<string>('')
const defaultWarehouseId = ref<string>('')

const statusFilter = ref('')
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Ordered', value: 'ORDERED' },
  { label: 'Partial', value: 'PARTIAL' },
  { label: 'Received', value: 'RECEIVED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const columns = [
  { key: 'po_number', label: 'PO Number' },
  { key: 'status', label: 'Status' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'total', label: 'Total' },
  { key: 'created_at', label: 'Date', format: (v: string) => new Date(v).toLocaleDateString() },
  { key: 'actions', label: 'Actions' },
]

const showCreateModal = ref(false)
const showReceiveModal = ref(false)
const showDetailsModal = ref(false)
const selectedOrder = ref<any>(null)
const receiveItems = ref<any[]>([])
const receiveNotes = ref('')

const createForm = ref({
  supplier_id: '',
  expected_date: '',
  notes: '',
  items: [] as any[],
})

function getStatusColor(status: string) {
  switch (status) {
    case 'DRAFT': return 'gray'
    case 'ORDERED': return 'blue'
    case 'PARTIAL': return 'amber'
    case 'RECEIVED': return 'emerald'
    case 'CANCELLED': return 'red'
    default: return 'gray'
  }
}

function getVariantSku(variantId: string) {
  const v = variants.value.find((item) => item.id === variantId)
  return v ? v.sku : variantId.substring(0, 8)
}

function addItemRow() {
  createForm.value.items.push({
    variant_id: variants.value[0]?.id || '',
    quantity_ordered: 10,
    unit_cost: variants.value[0]?.cost_price || 10,
  })
}

function removeItemRow(index: number) {
  createForm.value.items.splice(index, 1)
}

function openCreateModal() {
  createForm.value = {
    supplier_id: suppliers.value[0]?.id || '',
    expected_date: '',
    notes: '',
    items: [
      {
        variant_id: variants.value[0]?.id || '',
        quantity_ordered: 10,
        unit_cost: variants.value[0]?.cost_price || 10,
      },
    ],
  }
  showCreateModal.value = true
}

async function fetchOrders() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {}
    if (statusFilter.value) params.status = statusFilter.value
    const data = await purchaseApi.listOrders(params) as any[]
    orders.value = data
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function fetchMetadata() {
  try {
    const [supps, vars, stocks] = await Promise.all([
      supplierApi.listSuppliers() as Promise<any[]>,
      variantApi.listVariants({ limit: 500 }) as Promise<any[]>,
      invApi.listStocks() as Promise<any[]>,
    ])
    suppliers.value = supps
    variants.value = vars
    if (stocks.length > 0) {
      defaultWarehouseId.value = stocks[0].warehouse_id
    }
  } catch (e) {
    console.error('Failed to fetch metadata:', e)
  }
}

async function handleCreateOrder() {
  if (createForm.value.items.length === 0) {
    toast.add({ title: 'Error', description: 'Add at least one item', color: 'red' })
    return
  }
  saving.value = true
  try {
    await purchaseApi.createOrder({
      supplier_id: createForm.value.supplier_id,
      branch_id: defaultWarehouseId.value ? undefined : undefined,
      warehouse_id: defaultWarehouseId.value,
      expected_date: createForm.value.expected_date || undefined,
      notes: createForm.value.notes,
      items: createForm.value.items,
    })
    toast.add({ title: 'Success', description: 'Purchase order created successfully', color: 'green' })
    showCreateModal.value = false
    await fetchOrders()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function approveOrder(order: any) {
  try {
    await purchaseApi.approveOrder(order.id)
    toast.add({ title: 'Success', description: `PO ${order.po_number} approved`, color: 'green' })
    await fetchOrders()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  }
}

function openReceiveModal(order: any) {
  selectedOrder.value = order
  receiveNotes.value = ''
  receiveItems.value = order.items
    .filter((item: any) => item.quantity_ordered > item.quantity_received)
    .map((item: any) => ({
      purchase_item_id: item.id,
      variant_id: item.variant_id,
      quantity_ordered: item.quantity_ordered,
      quantity_received: item.quantity_received,
      unit_cost: item.unit_cost,
      receive_now: item.quantity_ordered - item.quantity_received,
    }))
  showReceiveModal.value = true
}

async function handleReceiveGoods() {
  const itemsToReceive = receiveItems.value
    .filter((i) => i.receive_now > 0)
    .map((i) => ({
      purchase_item_id: i.purchase_item_id,
      variant_id: i.variant_id,
      quantity_received: i.receive_now,
      unit_cost: i.unit_cost,
    }))

  if (itemsToReceive.length === 0) {
    toast.add({ title: 'Warning', description: 'No quantities specified to receive', color: 'amber' })
    return
  }

  saving.value = true
  try {
    await purchaseApi.createReceipt({
      purchase_order_id: selectedOrder.value.id,
      notes: receiveNotes.value,
      items: itemsToReceive,
    })
    toast.add({ title: 'Success', description: 'Goods received and inventory updated!', color: 'green' })
    showReceiveModal.value = false
    await fetchOrders()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

function openDetailsModal(order: any) {
  selectedOrder.value = order
  showDetailsModal.value = true
}

onMounted(async () => {
  await fetchMetadata()
  await fetchOrders()
})
</script>
