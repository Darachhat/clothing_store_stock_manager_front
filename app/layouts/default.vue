<template>
  <div class="admin-root">
    <!-- ─── Unified Reusable Sidebar ─────────────────────────────── -->
    <AppSidebar />

    <!-- ─── Admin Main Content ─────────────────────────────────── -->
    <div class="admin-main">
      <!-- Top bar -->
      <header class="admin-topbar">
        <h1 class="admin-topbar__title">{{ pageTitle }}</h1>
        <div class="admin-topbar__actions">
          <NuxtLink to="/pos" class="btn btn--sm" style="display:inline-flex; align-items:center; gap:6px;">
            <UIcon name="i-heroicons-computer-desktop" class="w-3.5 h-3.5" />
            Open POS
          </NuxtLink>
        </div>
      </header>

      <!-- Page content -->
      <div class="admin-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#app'
import { useSidebar } from '~/composables/useSidebar'

const route = useRoute()
const { navSections } = useSidebar()

const pageTitle = computed(() => {
  const path = route.path
  const allItems = navSections.flatMap(s => s.items)
  const found = allItems.find(i => i.to === path || (path.startsWith(i.to + '/') && i.to !== '/'))
  return found?.label || 'Clothing Store'
})
</script>
