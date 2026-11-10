<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="flex flex-col gap-0.5">
        <NuxtLink to="/purchases" class="inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink no-underline mb-1 transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Purchase Orders
        </NuxtLink>
        <h2 class="text-base font-semibold text-ink tracking-tight">{{ order?.po_number ?? '…' }}</h2>
        <p class="text-xs text-ink-tertiary mt-0.5">Purchase Order Detail</p>
      </div>
      <div v-if="order" class="flex items-center gap-2">
        <AppBadge :color="statusColor(order.status)">{{ order.status }}</AppBadge>
        <AppButton
          v-if="order.status === 'DRAFT'"
          variant="default"
          :loading="acting"
          @click="handleApprove"
        >Approve</AppButton>
        <AppButton
          v-if="['DRAFT','APPROVED'].includes(order.status)"
          variant="ghost"
          :loading="acting"
          @click="handleCancel"
        >Cancel</AppButton>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center p-12 bg-surface-card border border-border-subtle rounded-lg text-ink-tertiary text-xs sm:text-sm">Loading…</div>

    <template v-else-if="order">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 items-start">
        <div class="flex flex-col gap-4">
          <!-- Items -->
          <AppCard title="Items">
            <AppTable :columns="itemCols" :rows="order.items ?? []" :loading="false" empty-text="No items.">
              <template #cell-unit_cost="{ value }">${{ Number(value).toFixed(2) }}</template>
              <template #cell-total_cost="{ value }"><strong>${{ Number(value).toFixed(2) }}</strong></template>
            </AppTable>
          </AppCard>

          <!-- Goods Receipts -->
          <AppCard title="Goods Receipts">
            <AppTable :columns="receiptCols" :rows="receipts" :loading="loadingReceipts" empty-text="No receipts yet." />
            <div v-if="['APPROVED','PARTIALLY_RECEIVED'].includes(order.status)" class="mt-3">
              <AppButton variant="default" size="sm" @click="openReceive">Record Goods Receipt</AppButton>
            </div>
          </AppCard>
        </div>

        <!-- Summary -->
        <div class="flex flex-col gap-4">
          <AppCard title="Order Summary">
            <dl class="flex flex-col">
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]"><dt class="text-ink-tertiary">PO Number</dt><dd class="text-ink font-medium m-0"><code class="font-mono text-xs">{{ order.po_number }}</code></dd></div>
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]">
                <dt class="text-ink-tertiary">Status</dt>
                <dd class="text-ink font-medium m-0"><AppBadge :color="statusColor(order.status)">{{ order.status }}</AppBadge></dd>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]"><dt class="text-ink-tertiary">Supplier</dt><dd class="text-ink font-medium m-0">{{ order.supplier?.name ?? order.supplier_id }}</dd></div>
              <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]"><dt class="text-ink-tertiary">Expected Delivery</dt><dd class="text-ink font-medium m-0">{{ order.expected_delivery_date ?? '—' }}</dd></div>
              <div class="border-b-2 border-border-subtle my-1" />
              <div class="flex justify-between items-center py-2 text-sm font-bold text-ink">
                <dt class="text-ink-secondary">Total</dt>
                <dd class="text-ink font-bold m-0">${{ Number(order.total).toFixed(2) }}</dd>
              </div>
              <div class="border-b-2 border-border-subtle my-1" />
              <div class="flex justify-between items-center py-2 border-b-0 text-xs sm:text-[13px]"><dt class="text-ink-tertiary">Created</dt><dd class="text-ink font-medium m-0">{{ fmtDate(order.created_at) }}</dd></div>
            </dl>
          </AppCard>
        </div>
      </div>
    </template>

    <div v-else class="flex items-center justify-center p-12 bg-surface-card border border-border-subtle rounded-lg text-ink-tertiary text-xs sm:text-sm">Purchase order not found.</div>

    <!-- Receive Modal -->
    <AppModal v-model="showReceive" title="Record Goods Receipt">
      <form class="flex flex-col gap-3.5" @submit.prevent="submitReceipt">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-secondary">Note</label>
          <textarea v-model="receiveForm.note" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors resize-y min-h-[60px]" rows="2" />
        </div>
        <p class="text-xs font-medium text-ink-secondary mb-1">Received Items</p>
        <div v-for="(ri, idx) in receiveForm.items" :key="idx" class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Variant ID</label>
            <input v-model="ri.variant_id" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors font-mono" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Qty Received</label>
            <input v-model.number="ri.quantity_received" type="number" min="1" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" required />
          </div>
        </div>
        <AppButton type="button" variant="ghost" size="sm" @click="addReceiveItem">+ Add Item</AppButton>
        <div class="flex justify-end gap-2 pt-2 border-t border-border-subtle">
          <AppButton type="button" variant="ghost" @click="showReceive = false">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="acting">Submit Receipt</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Purchase Order — Clothing Store' })

const { getOrder, approveOrder, cancelOrder, listReceipts, createReceipt } = usePurchaseApi()
const { addToast } = useAppToast()

const order = ref<any>(null)
const receipts = ref<any[]>([])
const loading = ref(true)
const loadingReceipts = ref(false)
const acting = ref(false)
const showReceive = ref(false)

const receiveForm = reactive({
  note: '',
  items: [{ variant_id: '', quantity_received: 1 }],
})

const itemCols = [
  { key: 'variant_id', label: 'Variant' },
  { key: 'quantity_ordered', label: 'Ordered' },
  { key: 'quantity_received', label: 'Received' },
  { key: 'unit_cost', label: 'Unit Cost' },
  { key: 'total_cost', label: 'Total' },
]
const receiptCols = [
  { key: 'receipt_number', label: 'Receipt #' },
  { key: 'received_at', label: 'Date' },
  { key: 'note', label: 'Note' },
]

function fmtDate(d: string) { return new Date(d).toLocaleDateString() }
function statusColor(s: string) {
  const m: Record<string, string> = { DRAFT: 'default', APPROVED: 'yellow', PARTIALLY_RECEIVED: 'yellow', RECEIVED: 'green', CANCELLED: 'red' }
  return m[s] ?? 'default'
}

function openReceive() {
  receiveForm.note = ''
  receiveForm.items = [{ variant_id: '', quantity_received: 1 }]
  showReceive.value = true
}
function addReceiveItem() { receiveForm.items.push({ variant_id: '', quantity_received: 1 }) }

async function handleApprove() {
  if (!confirm('Approve this purchase order?')) return
  acting.value = true
  try {
    await approveOrder(id)
    addToast({ type: 'success', title: 'Order approved' })
    order.value = await getOrder(id)
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally { acting.value = false }
}

async function handleCancel() {
  if (!confirm('Cancel this purchase order?')) return
  acting.value = true
  try {
    await cancelOrder(id)
    addToast({ type: 'success', title: 'Order cancelled' })
    order.value = await getOrder(id)
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally { acting.value = false }
}

async function submitReceipt() {
  acting.value = true
  try {
    await createReceipt({
      purchase_order_id: id,
      note: receiveForm.note || null,
      items: receiveForm.items,
    })
    addToast({ type: 'success', title: 'Receipt recorded' })
    showReceive.value = false
    await loadData()
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally { acting.value = false }
}

async function loadData() {
  loadingReceipts.value = true
  try {
    [order.value, receipts.value] = await Promise.all([getOrder(id), listReceipts(id)]) as [any, any[]]
  } finally { loadingReceipts.value = false }
}

onMounted(async () => {
  try { await loadData() } finally { loading.value = false }
})
</script>
