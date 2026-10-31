<template>
  <div class="page-root">
    <div class="page-header">
      <div class="page-header__left">
        <NuxtLink to="/purchases" class="back-link">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Purchase Orders
        </NuxtLink>
        <h2 class="page-title">New Purchase Order</h2>
        <p class="page-subtitle">Create a new purchase order for a supplier</p>
      </div>
    </div>

    <AppCard title="Order Information">
      <form class="form-grid" @submit.prevent="submit">
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Supplier <span class="required">*</span></label>
            <AppSelect v-model="form.supplier_id" :options="supplierOptions" placeholder="Select supplier" required />
          </div>
          <div class="form-field">
            <label class="field-label">Expected Delivery Date</label>
            <input v-model="form.expected_delivery_date" type="date" class="field-input" />
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Notes</label>
          <textarea v-model="form.notes" class="field-input field-textarea" rows="2" placeholder="Optional notes" />
        </div>

        <!-- Line Items -->
        <div class="items-section">
          <div class="items-header">
            <span class="items-title">Order Items</span>
            <AppButton type="button" variant="ghost" size="sm" @click="addItem">+ Add Item</AppButton>
          </div>

          <div v-for="(item, idx) in form.items" :key="idx" class="item-row">
            <div class="item-field item-field--variant">
              <label class="field-label">Variant ID</label>
              <input v-model="item.variant_id" class="field-input" placeholder="UUID" required />
            </div>
            <div class="item-field item-field--qty">
              <label class="field-label">Qty <span class="required">*</span></label>
              <input v-model.number="item.quantity" type="number" min="1" class="field-input" required />
            </div>
            <div class="item-field item-field--price">
              <label class="field-label">Unit Cost ($)</label>
              <input v-model.number="item.unit_cost" type="number" step="0.01" min="0" class="field-input" required />
            </div>
            <button type="button" class="remove-btn" @click="removeItem(idx)" title="Remove">
              <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
            </button>
          </div>

          <div v-if="!form.items.length" class="empty-items">No items added yet.</div>
        </div>

        <!-- Totals -->
        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${{ subtotal.toFixed(2) }}</span>
          </div>
        </div>

        <div class="form-actions">
          <AppButton type="button" variant="ghost" to="/purchases">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="saving" :disabled="!form.supplier_id || !form.items.length">
            Create Purchase Order
          </AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import type { Supplier } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'New Purchase Order — Clothing Store' })

const { listSuppliers } = useSupplierApi()
const { createOrder } = usePurchaseApi()
const { addToast } = useAppToast()

const saving = ref(false)
const supplierOptions = ref<{ label: string; value: string }[]>([])

const form = reactive({
  supplier_id: '',
  expected_delivery_date: '',
  notes: '',
  items: [] as { variant_id: string; quantity: number; unit_cost: number }[],
})

const subtotal = computed(() =>
  form.items.reduce((s, i) => s + i.quantity * i.unit_cost, 0)
)

function addItem() {
  form.items.push({ variant_id: '', quantity: 1, unit_cost: 0 })
}

function removeItem(idx: number) {
  form.items.splice(idx, 1)
}

async function submit() {
  saving.value = true
  try {
    const payload = {
      supplier_id: form.supplier_id,
      expected_delivery_date: form.expected_delivery_date || null,
      notes: form.notes || null,
      items: form.items.map(i => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
      })),
    }
    const order = await createOrder(payload) as any
    addToast({ type: 'success', title: 'Purchase order created' })
    await navigateTo(`/purchases/${order.id}`)
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const suppliers = await listSuppliers() as Supplier[]
  supplierOptions.value = suppliers.map(s => ({ label: s.name, value: s.id }))
  addItem()
})
</script>

<style scoped>
.page-root { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-header__left { display: flex; flex-direction: column; gap: 2px; }
.back-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-tertiary); text-decoration: none; margin-bottom: 4px; }
.back-link:hover { color: var(--text-primary); }
.page-title { font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
.page-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }

.form-grid { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.required { color: #ef4444; }
.field-input { padding: 8px 10px; font-size: 13px; background: var(--surface-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color .15s; box-sizing: border-box; width: 100%; }
.field-input:focus { border-color: var(--color-primary); }
.field-textarea { resize: vertical; min-height: 64px; }

.items-section { display: flex; flex-direction: column; gap: 8px; }
.items-header { display: flex; align-items: center; justify-content: space-between; }
.items-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }

.item-row { display: grid; grid-template-columns: 1fr 90px 130px 28px; gap: 8px; align-items: end; }
@media (max-width: 640px) { .item-row { grid-template-columns: 1fr 80px 110px 28px; } }

.item-field { display: flex; flex-direction: column; gap: 4px; }
.remove-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 34px; background: transparent;
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  color: var(--text-tertiary); cursor: pointer; transition: all .15s;
}
.remove-btn:hover { background: #fee2e2; border-color: #ef4444; color: #ef4444; }

.empty-items { font-size: 13px; color: var(--text-tertiary); font-style: italic; padding: 12px 0; }

.totals { padding: 12px 0; border-top: 1px solid var(--border-subtle); display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.total-row { display: flex; gap: 24px; font-size: 13px; color: var(--text-primary); font-weight: 600; }

.form-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; }
</style>
