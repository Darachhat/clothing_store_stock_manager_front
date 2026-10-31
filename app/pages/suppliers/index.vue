<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Suppliers</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage vendors and procurement contacts</p>
      </div>
      <AppButton label="Add Supplier" variant="primary" @click="openCreateModal" />
    </div>

    <!-- Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="suppliers"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-building-office-2', label: 'No suppliers added yet' }"
      >
        <template #cell-code="{ row }">
          <span class="font-mono text-xs text-gray-500">{{ row.code }}</span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="row.status === 'ACTIVE' ? 'emerald' : 'gray'" :label="row.status" size="sm" variant="subtle" />
        </template>

        <template #cell-actions="{ row }">
          <div class="flex gap-1">
            <AppButton size="sm" variant="ghost" label="View" :to="`/suppliers/${row.id}`" />
            <AppButton size="sm" variant="ghost" @click="openEditModal(row)" />
            <AppButton
              v-if="row.status === 'ACTIVE'"
              size="sm" variant="danger"
              @click="deactivateSupplier(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal v-model="showModal">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ editingSupplier ? 'Edit Supplier' : 'Add Supplier' }}</h3>
            <AppButton variant="ghost" size="sm" @click="showModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label>
            <input v-model="form.name" type="text" required placeholder="e.g. Alpha Garment Co."
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
              <input v-model="form.contact_person" type="text" placeholder="Sales representative name"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input v-model="form.phone" type="tel" placeholder="+855 23 ..."
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input v-model="form.email" type="email" placeholder="supplier@example.com"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <textarea v-model="form.address" rows="2" placeholder="Full address"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <input v-model="form.notes" type="text" placeholder="Payment terms, lead times, etc."
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showModal = false" />
            <AppButton type="submit" variant="primary" :label="editingSupplier ? 'Save Changes' : 'Add Supplier'" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const supplierApi = useSupplierApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const suppliers = ref<any[]>([])
const showModal = ref(false)
const editingSupplier = ref<any>(null)

const form = ref({
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
})

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Company Name' },
  { key: 'contact_person', label: 'Contact' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

function openCreateModal() {
  editingSupplier.value = null
  form.value = { name: '', contact_person: '', phone: '', email: '', address: '', notes: '' }
  showModal.value = true
}

function openEditModal(supplier: any) {
  editingSupplier.value = supplier
  form.value = {
    name: supplier.name,
    contact_person: supplier.contact_person || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
    address: supplier.address || '',
    notes: supplier.notes || '',
  }
  showModal.value = true
}

async function fetchSuppliers() {
  loading.value = true
  try {
    const data = await supplierApi.listSuppliers() as any[]
    suppliers.value = data
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  try {
    if (editingSupplier.value) {
      await supplierApi.updateSupplier(editingSupplier.value.id, form.value)
      toast.add({ title: 'Updated', description: 'Supplier updated successfully', color: 'green' })
    } else {
      await supplierApi.createSupplier(form.value)
      toast.add({ title: 'Added', description: 'Supplier added successfully', color: 'green' })
    }
    showModal.value = false
    await fetchSuppliers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function deactivateSupplier(supplier: any) {
  if (!confirm(`Deactivate "${supplier.name}"?`)) return
  try {
    await supplierApi.updateSupplier(supplier.id, { status: 'INACTIVE' })
    toast.add({ title: 'Deactivated', description: `${supplier.name} deactivated`, color: 'amber' })
    await fetchSuppliers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  }
}

onMounted(fetchSuppliers)
</script>
