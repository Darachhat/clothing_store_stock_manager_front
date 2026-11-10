<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="flex flex-col gap-0.5">
        <h2 class="text-base font-semibold text-ink tracking-tight">Product Stickers &amp; Barcodes</h2>
        <p class="text-xs text-ink-tertiary mt-0.5">Generate and print garment stickers, QR tags, and Code-128 barcodes for retail shelves</p>
      </div>
      <AppButton variant="primary" to="/labels/generate">
        <template #icon-left>
          <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
        </template>
        Open Sticker Generator
      </AppButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AppCard>
        <div class="flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-md bg-surface-bg border border-border-subtle flex items-center justify-center text-ink shrink-0">
            <UIcon name="i-heroicons-tag" class="w-5 h-5" />
          </div>
          <div class="flex flex-col gap-1.5 flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-ink m-0">Thermal Garment Stickers (50×30mm &amp; 40×30mm)</h3>
            <p class="text-xs text-ink-secondary leading-relaxed m-0">
              Print individual adhesive price stickers directly to thermal label printers (Zebra, Xprinter) with QR or Code-128 barcode, SKU, size/color, and dual USD/KHR pricing.
            </p>
            <div class="pt-1">
              <AppButton size="sm" variant="primary" to="/labels/generate?preset=THERMAL_50x30">
                Print Thermal Stickers
              </AppButton>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-md bg-surface-bg border border-border-subtle flex items-center justify-center text-ink shrink-0">
            <UIcon name="i-heroicons-qr-code" class="w-5 h-5" />
          </div>
          <div class="flex flex-col gap-1.5 flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-ink m-0">A4 / A5 Multi-Column Sticker Sheets</h3>
            <p class="text-xs text-ink-secondary leading-relaxed m-0">
              Generate multi-column PDF sticker sheets or print directly from the browser for standard office laser/inkjet adhesive label sheets.
            </p>
            <div class="pt-1">
              <AppButton size="sm" variant="default" to="/labels/generate?preset=A4">
                Generate A4 Sheet
              </AppButton>
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <AppCard title="Quick Actions">
      <div class="flex flex-wrap gap-2.5">
        <AppButton to="/labels/generate" variant="primary" label="Open Sticker & Label Studio" />
        <AppButton to="/products" variant="default" label="Manage Products & Variants" />
        <AppButton to="/inventory" variant="default" label="View Stock Levels" />
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Labels & Stickers — Clothing Store' })
</script>
