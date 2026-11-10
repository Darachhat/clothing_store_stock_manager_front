<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col gap-0.5">
        <NuxtLink to="/suppliers" class="inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink no-underline mb-1 transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Suppliers
        </NuxtLink>
        <h2 class="text-base font-semibold text-ink tracking-tight">{{ supplier?.name ?? '…' }}</h2>
        <p class="text-xs text-ink-tertiary mt-0.5">{{ supplier?.code }}</p>
      </div>
      <AppButton v-if="supplier" variant="default" @click="openEdit">Edit</AppButton>
    </div>

    <div v-if="loading" class="flex items-center justify-center p-12 bg-surface-card border border-border-subtle rounded-lg text-ink-tertiary text-xs sm:text-sm">Loading…</div>

    <template v-else-if="supplier">
      <div class="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 items-start">
        <AppCard title="Supplier Information">
          <dl class="flex flex-col">
            <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]"><dt class="text-ink-tertiary">Code</dt><dd class="text-ink font-medium m-0"><code class="font-mono text-xs">{{ supplier.code }}</code></dd></div>
            <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]"><dt class="text-ink-tertiary">Name</dt><dd class="text-ink font-medium m-0">{{ supplier.name }}</dd></div>
            <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]"><dt class="text-ink-tertiary">Phone</dt><dd class="text-ink font-medium m-0">{{ supplier.phone ?? '—' }}</dd></div>
            <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]"><dt class="text-ink-tertiary">Email</dt><dd class="text-ink font-medium m-0">{{ supplier.email ?? '—' }}</dd></div>
            <div class="flex justify-between items-center py-2 border-b border-border-subtle text-xs sm:text-[13px]"><dt class="text-ink-tertiary">Contact Person</dt><dd class="text-ink font-medium m-0">{{ supplier.contact_person ?? '—' }}</dd></div>
            <div class="flex justify-between items-center py-2 border-b-0 text-xs sm:text-[13px]">
              <dt class="text-ink-tertiary">Status</dt>
              <dd class="text-ink font-medium m-0"><AppBadge :color="supplier.status === 'ACTIVE' ? 'green' : 'default'">{{ supplier.status }}</AppBadge></dd>
            </div>
          </dl>
        </AppCard>

        <AppCard title="Purchase History">
          <div class="text-xs sm:text-[13px] text-ink-tertiary italic">Recent purchase orders will appear here.</div>
        </AppCard>
      </div>
    </template>

    <div v-else class="flex items-center justify-center p-12 bg-surface-card border border-border-subtle rounded-lg text-ink-tertiary text-xs sm:text-sm">Supplier not found.</div>

    <!-- Edit Modal -->
    <AppModal v-model="showEdit" title="Edit Supplier">
      <form class="flex flex-col gap-3.5" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-secondary">Name <span class="text-status-red">*</span></label>
          <input v-model="form.name" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" required />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Phone</label>
            <input v-model="form.phone" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Email</label>
            <input v-model="form.email" type="email" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Contact Person</label>
            <input v-model="form.contact_person" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Status</label>
            <AppSelect v-model="form.status" :options="statusOptions" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-secondary">Address</label>
          <textarea v-model="form.address" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors resize-y min-h-[60px]" rows="2" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-secondary">Notes</label>
          <textarea v-model="form.notes" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors resize-y min-h-[60px]" rows="2" />
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-border-subtle">
          <AppButton type="button" variant="ghost" @click="showEdit = false">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="saving">Save</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { Supplier } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Supplier — Clothing Store' })

const { getSupplier, updateSupplier } = useSupplierApi()
const { addToast } = useAppToast()

const supplier = ref<Supplier | null>(null)
const loading = ref(true)
const saving = ref(false)
const showEdit = ref(false)

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const form = reactive({
  name: '', phone: '', email: '', contact_person: '', address: '', notes: '', status: 'ACTIVE',
})

function openEdit() {
  if (!supplier.value) return
  Object.assign(form, {
    name: supplier.value.name,
    phone: supplier.value.phone ?? '',
    email: supplier.value.email ?? '',
    contact_person: supplier.value.contact_person ?? '',
    address: (supplier.value as any).address ?? '',
    notes: (supplier.value as any).notes ?? '',
    status: supplier.value.status,
  })
  showEdit.value = true
}

async function save() {
  saving.value = true
  try {
    await updateSupplier(id, {
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      contact_person: form.contact_person || null,
      address: form.address || null,
      notes: form.notes || null,
      status: form.status,
    })
    addToast({ type: 'success', title: 'Supplier updated' })
    supplier.value = await getSupplier(id) as Supplier
    showEdit.value = false
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    supplier.value = await getSupplier(id) as Supplier
  } finally {
    loading.value = false
  }
})
</script>
