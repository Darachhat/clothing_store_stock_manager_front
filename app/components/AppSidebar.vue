<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useSidebar, type NavItem } from '~/composables/useSidebar'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    mode?: 'full' | 'rail' | 'auto'
    defaultCollapsed?: boolean
    collapsible?: boolean
    customClass?: string
    showShortcuts?: boolean
    ariaLabel?: string
  }>(),
  {
    modelValue: undefined,
    mode: 'auto',
    defaultCollapsed: undefined,
    collapsible: true,
    customClass: '',
    showShortcuts: true,
    ariaLabel: 'Main navigation',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'shortcuts'): void
  (e: 'logout'): void
}>()

const config = useRuntimeConfig()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { isCollapsed: globalCollapsed, navSections, toggle: globalToggle } = useSidebar()

// Internal reactive state if defaultCollapsed is provided, otherwise use global state
const internalCollapsed = ref(
  props.defaultCollapsed !== undefined ? props.defaultCollapsed : globalCollapsed.value
)

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) internalCollapsed.value = val
  }
)

const isRail = computed(() => {
  if (props.mode === 'rail') return true
  if (props.mode === 'full') return false
  if (props.modelValue !== undefined) return props.modelValue
  if (props.defaultCollapsed !== undefined) return internalCollapsed.value
  return globalCollapsed.value
})

function toggleCollapse() {
  const nextVal = !isRail.value
  internalCollapsed.value = nextVal
  emit('update:modelValue', nextVal)
  if (props.defaultCollapsed === undefined && props.modelValue === undefined) {
    globalToggle()
  }
}

// Flat list of primary items for rail mode
const railItems = computed<NavItem[]>(() => {
  const primaries: NavItem[] = []
  for (const sec of navSections) {
    for (const it of sec.items) {
      if (it.railPrimary) {
        primaries.push(it)
      }
    }
  }
  return primaries
})

const branchName = computed(() => {
  return authStore.currentUser?.branch?.name || ''
})

const userName = computed(() => {
  return authStore.currentUser?.full_name || authStore.currentUser?.username || 'User'
})

const userRole = computed(() => {
  return authStore.currentUser?.roles?.[0]?.name || 'Staff'
})

const userInitials = computed(() => {
  const name = userName.value
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase() || 'U'
})

function isActive(to: string): boolean {
  if (to === '/dashboard') return route.path === '/dashboard' || route.path === '/'
  return route.path === to || route.path.startsWith(to + '/')
}

async function onLogout() {
  emit('logout')
  try {
    await authStore.logout()
  } catch (err) {
    console.error('Logout error:', err)
  }
  await router.push('/login')
}
</script>

<template>
  <aside
    class="bg-surface-card border-r border-border-subtle flex flex-col transition-all duration-200 select-none z-20 h-full no-print"
    :class="[
      isRail ? 'w-14 min-w-[56px]' : 'w-60 min-w-[240px]',
      customClass,
    ]"
    :aria-label="ariaLabel || 'Main navigation'"
  >
    <!-- ─── Header: Brand Logo & Title ─────────────────────────────── -->
    <div class="flex items-center justify-between h-14 px-3 border-b border-border-subtle shrink-0">
      <NuxtLink to="/dashboard" class="flex items-center gap-2.5 min-w-0 no-underline text-ink" :title="config.public.appName">
        <div class="w-8 h-8 rounded-md bg-brand-900 flex items-center justify-center shrink-0">
          <UIcon name="i-heroicons-building-storefront" class="w-4 h-4 text-white" />
        </div>
        <div v-if="!isRail" class="flex flex-col min-w-0">
          <span class="text-xs font-bold text-ink truncate leading-tight">{{ config.public.appName }}</span>
          <span v-if="branchName" class="text-[10px] text-ink-tertiary truncate leading-tight">{{ branchName }}</span>
        </div>
      </NuxtLink>

      <!-- Collapse / Expand Toggle Button -->
      <button
        v-if="collapsible && !isRail"
        type="button"
        class="w-7 h-7 rounded flex items-center justify-center text-ink-tertiary hover:text-ink hover:bg-surface-hover cursor-pointer transition-colors border-none bg-transparent"
        title="Collapse sidebar"
        @click="toggleCollapse"
      >
        <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
      </button>
    </div>

    <!-- ─── Rail Mode Navigation (Icon Only) ───────────────────────── -->
    <nav v-if="isRail" class="flex-1 flex flex-col items-center py-2 gap-1 overflow-y-auto" aria-label="Quick navigation">
      <NuxtLink
        v-for="item in railItems"
        :key="item.to"
        :to="item.to"
        class="relative w-10 h-10 rounded-md flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-surface-hover transition-colors no-underline cursor-pointer"
        :class="{ '!bg-surface-active !text-ink': isActive(item.to) }"
        :title="item.label + (item.shortcut ? ` [${item.shortcut}]` : '')"
      >
        <UIcon :name="item.icon" class="w-5 h-5" />
        <span v-if="item.badge" class="absolute top-1 right-1 px-1 min-w-[14px] h-3.5 bg-brand-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{{ item.badge }}</span>
      </NuxtLink>
    </nav>

    <!-- ─── Full Mode Navigation (Categorized Sections) ────────────── -->
    <nav v-else class="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-4" aria-label="Categorized navigation">
      <div v-for="section in navSections" :key="section.title" class="flex flex-col gap-0.5">
        <span class="px-2.5 text-[10px] font-bold text-ink-tertiary uppercase tracking-wider mb-1">{{ section.title }}</span>
        <NuxtLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-secondary hover:text-ink hover:bg-surface-hover transition-colors no-underline"
          :class="{ '!bg-surface-active !text-ink font-semibold': isActive(item.to) }"
        >
          <span class="w-4 h-4 flex items-center justify-center text-inherit">
            <UIcon :name="item.icon" class="w-4 h-4" />
          </span>
          <span class="flex-1 truncate">{{ item.label }}</span>
          <span v-if="item.badge" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-900 text-white">{{ item.badge }}</span>
          <span v-else-if="item.shortcut" class="px-1.5 py-0.5 rounded text-[10px] font-mono text-ink-tertiary bg-surface-hover border border-border-subtle">{{ item.shortcut }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- ─── Bottom Footer Actions ──────────────────────────────────── -->
    <div class="border-t border-border-subtle p-2 shrink-0 flex flex-col gap-1" :class="{ 'items-center': isRail }">
      <!-- Rail-specific bottom icons -->
      <template v-if="isRail">
        <button
          v-if="collapsible"
          type="button"
          class="w-10 h-10 rounded-md flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
          title="Expand sidebar"
          @click="toggleCollapse"
        >
          <UIcon name="i-heroicons-chevron-right" class="w-5 h-5" />
        </button>

        <button
          v-if="showShortcuts"
          type="button"
          class="w-10 h-10 rounded-md flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
          title="Keyboard Shortcuts [?]"
          @click="$emit('shortcuts')"
        >
          <UIcon name="i-heroicons-question-mark-circle" class="w-5 h-5" />
        </button>

        <NuxtLink
          to="/settings"
          class="w-10 h-10 rounded-md flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-surface-hover transition-colors no-underline cursor-pointer"
          :class="{ '!bg-surface-active !text-ink': isActive('/settings') }"
          title="System Settings"
        >
          <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5" />
        </NuxtLink>

        <button
          type="button"
          class="w-10 h-10 rounded-md flex items-center justify-center text-ink-secondary hover:text-status-red hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
          title="Sign Out"
          @click="onLogout"
        >
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-5 h-5" />
        </button>
      </template>

      <!-- Full mode user card -->
      <template v-else>
        <div class="flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-hover transition-colors">
          <div class="w-7 h-7 rounded-full bg-brand-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-semibold text-ink truncate leading-tight" :title="userName">{{ userName }}</div>
            <div class="text-[10px] text-ink-tertiary truncate leading-tight">{{ userRole }}</div>
          </div>
          <button
            type="button"
            class="w-7 h-7 rounded flex items-center justify-center text-ink-tertiary hover:text-status-red hover:bg-surface-hover cursor-pointer transition-colors border-none bg-transparent shrink-0"
            title="Sign Out"
            @click="onLogout"
          >
            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
          </button>
        </div>
      </template>
    </div>
  </aside>
</template>
