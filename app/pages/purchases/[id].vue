<template>
  <div class="page-root">
    <div class="page-header">
      <div class="page-header__left">
        <NuxtLink to="/purchases" class="back-link">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Purchase Orders
        </NuxtLink>
        <h2 class="page-title">{{ order?.po_number ?? '…' }}</h2>
        <p class="page-subtitle">Purchase Order Detail</p>
      </div>
      <div v-if="order" class="page-header__actions">
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

    <div v-if="loading" class="state-card">Loading…</div>

    <template v-else-if="order">
      <div class="detail-grid">
        <div class="detail-col">
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
            <div v-if="['APPROVED','PARTIALLY_RECEIVED'].includes(order.status)" style="margin-top:12px;">
              <AppButton variant="default" size="sm" @click="openReceive">Record Goods Receipt</AppButton>
            </div>
          </AppCard>
        </div>

        <!-- Summary -->
        <div class="detail-col">
          <AppCard title="Order Summary">
            <dl class="detail-list">
              <div class="detail-row"><dt>PO Number</dt><dd><code class="mono">{{ order.po_number }}</code></dd></div>
              <div class="detail-row">
                <dt>Status</dt>
                <dd><AppBadge :color="statusColor(order.status)">{{ order.status }}</AppBadge></dd>
              </div>
              <div class="detail-row"><dt>Supplier</dt><dd>{{ order.supplier?.name ?? order.supplier_id }}</dd></div>
              <div class="detail-row"><dt>Expected Delivery</dt><dd>{{ order.expected_delivery_date ?? '—' }}</dd></div>
              <div class="detail-row separator" />
              <div class="detail-row total-row">
                <dt>Total</dt>
                <dd>${{ Number(order.total).toFixed(2) }}</dd>
              </div>
              <div class="detail-row separator" />
              <div class="detail-row"><dt>Created</dt><dd>{{ fmtDate(order.created_at) }}</dd></div>
            </dl>
          </AppCard>
        </div>
      </div>
    </template>

    <div v-else class="state-card">Purchase order not found.</div>

    <!-- Receive Modal -->
    <AppModal v-model="showReceive" title="Record Goods Receipt">
      <form class="form-grid" @submit.prevent="submitReceipt">
        <div class="form-field">
          <label class="field-label">Note</label>
          <textarea v-model="receiveForm.note" class="field-input field-textarea" rows="2" />
        </div>
        <p class="field-label" style="margin-bottom:4px;">Received Items</p>
        <div v-for="(ri, idx) in receiveForm.items" :key="idx" class="form-row">
          <div class="form-field">
            <label class="field-label">Variant ID</label>
            <input v-model="ri.variant_id" class="field-input" required />
          </div>
          <div class="form-field">
            <label class="field-label">Qty Received</label>
            <input v-model.number="ri.quantity_received" type="number" min="1" class="field-input" required />
          </div>
        </div>
        <AppButton type="button" variant="ghost" size="sm" @click="addReceiveItem">+ Add Item</AppButton>
        <div class="modal-actions">
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

<style scoped>
.page-root { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-header__left { display: flex; flex-direction: column; gap: 2px; }
.page-header__actions { display: flex; gap: 8px; align-items: center; }
.back-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-tertiary); text-decoration: none; margin-bottom: 4px; }
.back-link:hover { color: var(--text-primary); }
.page-title { font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
.page-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
.state-card { display: flex; align-items: center; justify-content: center; padding: 48px; background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); color: var(--text-tertiary); font-size: 13px; }
.detail-grid { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }
@media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
.detail-col { display: flex; flex-direction: column; gap: 16px; }
.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle); font-size: 13px; }
.detail-row:last-child { border-bottom: none; }
.detail-row.separator { border-bottom: 2px solid var(--border-subtle); padding: 0; height: 0; }
.detail-row dt { color: var(--text-tertiary); }
.detail-row dd { color: var(--text-primary); font-weight: 500; }
.total-row dt, .total-row dd { font-weight: 700; font-size: 14px; }
.mono { font-family: monospace; font-size: 12px; }
.form-grid { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.field-input { padding: 8px 10px; font-size: 13px; background: var(--surface-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color .15s; box-sizing: border-box; width: 100%; }
.field-input:focus { border-color: var(--color-primary); }
.field-textarea { resize: vertical; min-height: 60px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; }
</style>
