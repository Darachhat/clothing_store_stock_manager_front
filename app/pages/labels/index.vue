<template>
  <div class="page-root">
    <div class="page-header">
      <div class="page-header__left">
        <h2 class="page-title">Product Stickers &amp; Barcodes</h2>
        <p class="page-subtitle">Generate and print garment stickers, QR tags, and Code-128 barcodes for retail shelves</p>
      </div>
      <AppButton variant="primary" to="/labels/generate">
        <template #icon-left>
          <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
        </template>
        Open Sticker Generator
      </AppButton>
    </div>

    <div class="cards-grid">
      <AppCard>
        <div class="feature-card">
          <div class="feature-icon">
            <UIcon name="i-heroicons-tag" class="w-5 h-5" />
          </div>
          <div class="feature-body">
            <h3 class="feature-title">Thermal Garment Stickers (50×30mm &amp; 40×30mm)</h3>
            <p class="feature-desc">
              Print individual adhesive price stickers directly to thermal label printers (Zebra, Xprinter) with QR or Code-128 barcode, SKU, size/color, and dual USD/KHR pricing.
            </p>
            <div class="feature-actions">
              <AppButton size="sm" variant="primary" to="/labels/generate?preset=THERMAL_50x30">
                Print Thermal Stickers
              </AppButton>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="feature-card">
          <div class="feature-icon">
            <UIcon name="i-heroicons-qr-code" class="w-5 h-5" />
          </div>
          <div class="feature-body">
            <h3 class="feature-title">A4 / A5 Multi-Column Sticker Sheets</h3>
            <p class="feature-desc">
              Generate multi-column PDF sticker sheets or print directly from the browser for standard office laser/inkjet adhesive label sheets.
            </p>
            <div class="feature-actions">
              <AppButton size="sm" variant="default" to="/labels/generate?preset=A4">
                Generate A4 Sheet
              </AppButton>
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <AppCard title="Quick Actions">
      <div class="quick-links">
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

<style scoped>
.page-root { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-header__left { display: flex; flex-direction: column; gap: 2px; }
.page-title { font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
.page-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }

.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
.feature-card { display: flex; align-items: flex-start; gap: 14px; }
.feature-icon {
  width: 40px; height: 40px; border-radius: var(--radius-md);
  background: var(--surface-inset); border: 1px solid var(--border-subtle);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-primary); flex-shrink: 0;
}
.feature-body { display: flex; flex-direction: column; gap: 6px; }
.feature-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.feature-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
.feature-actions { padding-top: 4px; }
.quick-links { display: flex; flex-wrap: wrap; gap: 10px; }
</style>
