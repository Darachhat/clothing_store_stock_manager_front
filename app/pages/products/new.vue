<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <AppButton
        to="/products"
        variant="ghost"
      />
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Create New Product</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Add a product to your catalog</p>
      </div>
    </div>

    <AppCard>
      <form class="space-y-5" @submit.prevent="submitProduct">
        <div class="form-field"><label class="form-label">Product Name</label>
          <AppInput
            v-model="form.name"
            placeholder="e.g. Classic Cotton T-Shirt"
            size="lg"
            required
          />
        </div>

        <div class="form-field"><label class="form-label">Description</label>
          <textarea
            v-model="form.description"
            placeholder="Detailed description, fabric, wash instructions..."
            rows="3"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-field"><label class="form-label">Status</label>
            <AppSelect
              v-model="form.status"
              :options="[
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Draft / Inactive', value: 'INACTIVE' }
              ]"
            />
          </div>

          <div class="form-field">
            <label class="form-label">Product Image</label>
            <AppFileUpload
              v-model="form.image_url"
              folder="products"
              hint="Upload high-res product photo (PNG, JPG, WEBP)"
            />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <AppButton
            to="/products"
            variant="ghost"
          >
            Cancel
          </AppButton>
          <AppButton
            type="submit"
            variant="primary"
            :loading="isSubmitting"
          >
            Create Product
          </AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

useHead({ title: 'New Product — Clothing Store' })

const { createProduct } = useProductApi()
const { addToast } = useAppToast()
const router = useRouter()

const isSubmitting = ref(false)
const form = reactive({
  name: '',
  description: '',
  status: 'ACTIVE',
  image_url: '',
})

async function submitProduct() {
  if (!form.name.trim()) return
  isSubmitting.value = true
  try {
    const res: any = await createProduct({
      name: form.name.trim(),
      description: form.description || undefined,
      status: form.status,
      image_url: form.image_url || undefined,
    })
    addToast({ type: 'success', title: 'Product created', message: `${res.name} was added to the catalog.` })
    router.push('/products')
  } catch (err: any) {
    addToast({ type: 'error', title: 'Failed to create product', message: err?.data?.detail || err.message })
  } finally {
    isSubmitting.value = false
  }
}
</script>
