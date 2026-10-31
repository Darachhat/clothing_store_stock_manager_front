<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Manage store configuration, tax rates, and general preferences</p>
    </div>

    <!-- Store Information -->
    <AppCard>
      <template #header>
        <div class="flex items-center gap-2">
          
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Store Information</h3>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="saveStoreInfo">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name</label>
            <input v-model="storeInfo.name" type="text" placeholder="My Clothing Store"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
            <select v-model="storeInfo.currency" class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              <option value="USD">USD - US Dollar</option>
              <option value="KHR">KHR - Cambodian Riel</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input v-model="storeInfo.phone" type="tel" placeholder="+855 23 ..."
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input v-model="storeInfo.email" type="email" placeholder="store@example.com"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input v-model="storeInfo.address" type="text" placeholder="Store address"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt Footer Message</label>
            <textarea v-model="storeInfo.receipt_footer" rows="2" placeholder="Thank you for shopping with us!"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
        </div>
        <div class="flex justify-end">
          <AppButton type="submit" variant="primary" label="Save Store Info" :loading="savingStore" />
        </div>
      </form>
    </AppCard>

    <!-- Tax & Pricing -->
    <AppCard>
      <template #header>
        <div class="flex items-center gap-2">
          
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Tax &amp; Pricing</h3>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="saveTaxSettings">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Default Tax Rate (%)</label>
            <input v-model.number="taxSettings.default_tax_rate" type="number" step="0.01" min="0" max="100"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Included in Price?</label>
            <div class="flex items-center gap-3 mt-2">
              <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                <input v-model="taxSettings.tax_inclusive" type="radio" :value="true" />
                Yes (inclusive)
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                <input v-model="taxSettings.tax_inclusive" type="radio" :value="false" />
                No (exclusive)
              </label>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rounding</label>
            <select v-model="taxSettings.rounding" class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              <option value="none">No rounding</option>
              <option value="round">Round to nearest</option>
              <option value="ceil">Always round up</option>
              <option value="floor">Always round down</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end">
          <AppButton type="submit" variant="primary" label="Save Tax Settings" :loading="savingTax" />
        </div>
      </form>
    </AppCard>

    <!-- POS Settings -->
    <AppCard>
      <template #header>
        <div class="flex items-center gap-2">
          
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Point of Sale</h3>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="savePosSettings">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Low Stock Warning Threshold</label>
            <input v-model.number="posSettings.low_stock_threshold" type="number" min="1"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Default Payment Method</label>
            <select v-model="posSettings.default_payment_method" class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BAKONG">Bakong</option>
              <option value="KHQR">KHQR</option>
            </select>
          </div>
          <div class="md:col-span-2 flex items-center gap-2">
            <input v-model="posSettings.require_customer" type="checkbox" id="req-customer" class="rounded" />
            <label for="req-customer" class="text-sm text-gray-700 dark:text-gray-300">Require customer selection on POS sales</label>
          </div>
          <div class="md:col-span-2 flex items-center gap-2">
            <input v-model="posSettings.print_receipt_on_complete" type="checkbox" id="auto-receipt" class="rounded" />
            <label for="auto-receipt" class="text-sm text-gray-700 dark:text-gray-300">Auto-print receipt on sale completion</label>
          </div>
        </div>
        <div class="flex justify-end">
          <AppButton type="submit" variant="primary" label="Save POS Settings" :loading="savingPos" />
        </div>
      </form>
    </AppCard>

    <!-- Danger Zone -->
    <AppCard>
      <template #header>
        <div class="flex items-center gap-2">
          
          <h3 class="font-semibold text-red-600 dark:text-red-400 text-sm">Danger Zone</h3>
        </div>
      </template>
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Clear Transaction History</p>
            <p class="text-xs text-gray-500">Permanently delete all sales records. This cannot be undone.</p>
          </div>
          <AppButton variant="danger" size="sm" label="Clear History" @click="confirmDanger('clear_history')" />
        </div>
        <div class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Reset Inventory to Zero</p>
            <p class="text-xs text-gray-500">Set all stock levels to 0 for a fresh count.</p>
          </div>
          <AppButton variant="danger" size="sm" label="Reset Stock" @click="confirmDanger('reset_stock')" />
        </div>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const toast = useAppToast()

// Store settings stored locally (would normally come from API)
const storeInfo = ref({
  name: 'My Clothing Store',
  currency: 'USD',
  phone: '',
  email: '',
  address: '',
  receipt_footer: 'Thank you for your purchase!',
})

const taxSettings = ref({
  default_tax_rate: 10,
  tax_inclusive: false,
  rounding: 'round',
})

const posSettings = ref({
  low_stock_threshold: 5,
  default_payment_method: 'CASH',
  require_customer: false,
  print_receipt_on_complete: false,
})

const savingStore = ref(false)
const savingTax = ref(false)
const savingPos = ref(false)

// Load from localStorage for persistence without a settings API
onMounted(() => {
  const saved = localStorage.getItem('store_settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.storeInfo) storeInfo.value = { ...storeInfo.value, ...parsed.storeInfo }
      if (parsed.taxSettings) taxSettings.value = { ...taxSettings.value, ...parsed.taxSettings }
      if (parsed.posSettings) posSettings.value = { ...posSettings.value, ...parsed.posSettings }
    } catch (e) { /* ignore */ }
  }
})

function persistSettings() {
  localStorage.setItem('store_settings', JSON.stringify({
    storeInfo: storeInfo.value,
    taxSettings: taxSettings.value,
    posSettings: posSettings.value,
  }))
}

async function saveStoreInfo() {
  savingStore.value = true
  await new Promise(r => setTimeout(r, 400))
  persistSettings()
  toast.add({ title: 'Saved', description: 'Store information updated', color: 'green' })
  savingStore.value = false
}

async function saveTaxSettings() {
  savingTax.value = true
  await new Promise(r => setTimeout(r, 400))
  persistSettings()
  toast.add({ title: 'Saved', description: 'Tax settings updated', color: 'green' })
  savingTax.value = false
}

async function savePosSettings() {
  savingPos.value = true
  await new Promise(r => setTimeout(r, 400))
  persistSettings()
  toast.add({ title: 'Saved', description: 'POS settings updated', color: 'green' })
  savingPos.value = false
}

function confirmDanger(action: string) {
  const messages: Record<string, string> = {
    clear_history: 'Are you absolutely sure? This will permanently delete ALL sales history.',
    reset_stock: 'Are you absolutely sure? This will set ALL stock levels to zero.',
  }
  if (confirm(messages[action] || 'Are you sure?')) {
    toast.add({ title: 'Action Blocked', description: 'Danger zone actions are disabled in demo mode.', color: 'amber' })
  }
}
</script>
