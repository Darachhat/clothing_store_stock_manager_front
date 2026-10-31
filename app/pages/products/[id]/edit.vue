<template>
  <div class="page-root">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header__left">
        <NuxtLink :to="`/products/${id}`" class="back-link">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          {{ product?.name ?? 'Product' }}
        </NuxtLink>
        <h2 class="page-title">Edit Product</h2>
        <p class="page-subtitle">Update product information</p>
      </div>
    </div>

    <div v-if="loading" class="state-card">Loading…</div>

    <template v-else-if="product">
      <AppCard title="Basic Information">
        <form class="form-grid" @submit.prevent="save">
          <div class="form-field">
            <label class="field-label">Product Name <span class="required">*</span></label>
            <input v-model="form.name" class="field-input" required />
          </div>

          <div class="form-field">
            <label class="field-label">Description</label>
            <textarea v-model="form.description" class="field-input field-textarea" rows="4" />
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="field-label">Category</label>
              <AppSelect v-model="form.category_id" :options="categoryOptions" placeholder="Select category" />
            </div>
            <div class="form-field">
              <label class="field-label">Brand</label>
              <AppSelect v-model="form.brand_id" :options="brandOptions" placeholder="Select brand" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="field-label">Supplier</label>
              <AppSelect v-model="form.supplier_id" :options="supplierOptions" placeholder="Select supplier" />
            </div>
            <div class="form-field">
              <label class="field-label">Status</label>
              <AppSelect v-model="form.status" :options="statusOptions" />
            </div>
          </div>

          <div class="form-actions">
            <AppButton type="button" variant="ghost" :to="`/products/${id}`">Cancel</AppButton>
            <AppButton type="submit" variant="primary" :loading="saving">Save Changes</AppButton>
          </div>
        </form>
      </AppCard>
    </template>

    <div v-else class="state-card">Product not found.</div>
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

<style scoped>
.page-root { display: flex; flex-direction: column; gap: 16px; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-header__left { display: flex; flex-direction: column; gap: 2px; }

.back-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--text-tertiary); text-decoration: none; margin-bottom: 4px;
}
.back-link:hover { color: var(--text-primary); }

.page-title { font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
.page-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }

.state-card {
  display: flex; align-items: center; justify-content: center;
  padding: 48px; background: var(--surface-card); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg); color: var(--text-tertiary); font-size: 13px;
}

.form-grid { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }

.form-field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.required { color: var(--color-red, #ef4444); }

.field-input {
  width: 100%; padding: 8px 10px; font-size: 13px;
  background: var(--surface-inset); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md); color: var(--text-primary);
  font-family: var(--font-body); outline: none; transition: border-color .15s;
  box-sizing: border-box;
}
.field-input:focus { border-color: var(--color-primary); }
.field-textarea { resize: vertical; min-height: 90px; }

.form-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; }
</style>
