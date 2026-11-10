<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col gap-0.5">
        <NuxtLink to="/purchases" class="inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink no-underline mb-1 transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Purchase Orders
        </NuxtLink>
        <h2 class="text-base font-semibold text-ink tracking-tight">New Purchase Order</h2>
        <p class="text-xs text-ink-tertiary mt-0.5">Create a new purchase order for a supplier</p>
      </div>
    </div>

    <AppCard title="Order Information">
      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Supplier <span class="text-status-red">*</span></label>
            <AppSelect v-model="form.supplier_id" :options="supplierOptions" placeholder="Select supplier" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Expected Delivery Date</label>
            <input v-model="form.expected_delivery_date" type="date" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-secondary">Notes</label>
          <textarea v-model="form.notes" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors resize-y min-h-[64px]" rows="2" placeholder="Optional notes" />
        </div>

        <!-- Line Items -->
        <div class="flex flex-col gap-2 pt-2 border-t border-border-subtle">
          <div class="flex items-center justify-between">
            <span class="text-[13px] font-semibold text-ink">Order Items</span>
            <AppButton type="button" variant="ghost" size="sm" @click="addItem">+ Add Item</AppButton>
          </div>

          <div v-for="(item, idx) in form.items" :key="idx" class="grid grid-cols-[1fr_80px_110px_32px] sm:grid-cols-[1fr_90px_130px_32px] gap-2 items-end">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-ink-secondary">Variant ID</label>
              <input v-model="item.variant_id" class="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors font-mono" placeholder="UUID" required />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-ink-secondary">Qty <span class="text-status-red">*</span></label>
              <input v-model.number="item.quantity" type="number" min="1" class="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" required />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-ink-secondary">Unit Cost ($)</label>
              <input v-model.number="item.unit_cost" type="number" step="0.01" min="0" class="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" required />
            </div>
            <button type="button" class="flex items-center justify-center w-8 h-8 rounded border border-border-subtle text-ink-tertiary hover:bg-status-red-bg hover:text-status-red hover:border-status-red cursor-pointer transition-colors bg-transparent" @click="removeItem(idx)" title="Remove">
              <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
            </button>
          </div>

          <div v-if="!form.items.length" class="text-xs text-ink-tertiary italic py-3">No items added yet.</div>
        </div>

        <!-- Totals -->
        <div class="py-3 border-t border-border-subtle flex flex-col items-end gap-1">
          <div class="flex gap-6 text-xs sm:text-[13px] text-ink font-semibold">
            <span>Subtotal</span>
            <span>${{ subtotal.toFixed(2) }}</span>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-border-subtle">
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
