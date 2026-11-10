<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col gap-0.5">
        <NuxtLink :to="`/products/${id}`" class="inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink no-underline mb-1 transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          {{ product?.name ?? 'Product' }}
        </NuxtLink>
        <h2 class="text-base font-semibold text-ink tracking-tight">Edit Product</h2>
        <p class="text-xs text-ink-tertiary mt-0.5">Update product information</p>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center p-12 bg-surface-card border border-border-subtle rounded-lg text-ink-tertiary text-xs sm:text-sm">Loading…</div>

    <template v-else-if="product">
      <AppCard title="Basic Information">
        <form class="flex flex-col gap-4" @submit.prevent="save">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Product Name <span class="text-status-red">*</span></label>
            <input v-model="form.name" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors" required />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-secondary">Description</label>
            <textarea v-model="form.description" class="w-full px-2.5 py-2 text-xs sm:text-sm bg-surface-card border border-border-default rounded-md text-ink outline-none focus:border-ink transition-colors resize-y min-h-[90px]" rows="4" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-secondary">Category</label>
              <AppSelect v-model="form.category_id" :options="categoryOptions" placeholder="Select category" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-secondary">Brand</label>
              <AppSelect v-model="form.brand_id" :options="brandOptions" placeholder="Select brand" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-secondary">Supplier</label>
              <AppSelect v-model="form.supplier_id" :options="supplierOptions" placeholder="Select supplier" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-secondary">Status</label>
              <AppSelect v-model="form.status" :options="statusOptions" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <AppButton type="button" variant="ghost" :to="`/products/${id}`">Cancel</AppButton>
            <AppButton type="submit" variant="primary" :loading="saving">Save Changes</AppButton>
          </div>
        </form>
      </AppCard>
    </template>

    <div v-else class="flex items-center justify-center p-12 bg-surface-card border border-border-subtle rounded-lg text-ink-tertiary text-xs sm:text-sm">Product not found.</div>
  </div>
</template>

<script setup lang="ts">
import type { Product, Category, Brand, Supplier } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Edit Product — Clothing Store' })

const { getProduct, updateProduct } = useProductApi()
const { listCategories, listBrands } = useCatalogApi()
const { listSuppliers } = useSupplierApi()
const { addToast } = useAppToast()

const product = ref<Product | null>(null)
const loading = ref(true)
const saving = ref(false)

const form = reactive({
  name: '',
  description: '',
  category_id: '',
  brand_id: '',
  supplier_id: '',
  status: 'ACTIVE',
})

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Discontinued', value: 'DISCONTINUED' },
]

const categoryOptions = ref<{ label: string; value: string }[]>([])
const brandOptions = ref<{ label: string; value: string }[]>([])
const supplierOptions = ref<{ label: string; value: string }[]>([])

async function save() {
  saving.value = true
  try {
    await updateProduct(id, {
      name: form.name,
      description: form.description || null,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      supplier_id: form.supplier_id || null,
      status: form.status,
    })
    addToast({ type: 'success', title: 'Product updated' })
    await navigateTo(`/products/${id}`)
  } catch (e: any) {
    addToast({ type: 'error', title: 'Update failed', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [rawProduct, cats, brands, suppliers] = await Promise.all([
      getProduct(id),
      listCategories(),
      listBrands(),
      listSuppliers(),
    ])
    const p = rawProduct as Product
    product.value = p
    Object.assign(form, {
      name: p.name,
      description: p.description ?? '',
      category_id: p.category_id ?? '',
      brand_id: p.brand_id ?? '',
      supplier_id: p.supplier_id ?? '',
      status: p.status,
    })
    categoryOptions.value = (cats as Category[]).map(c => ({ label: c.name, value: c.id }))
    brandOptions.value = (brands as Brand[]).map(b => ({ label: b.name, value: b.id }))
    supplierOptions.value = (suppliers as Supplier[]).map(s => ({ label: s.name, value: s.id }))
  } finally {
    loading.value = false
  }
})
</script>
