<!-- AppTable — high-density data table, pure Tailwind -->
<template>
  <div class="overflow-x-auto">
    <!-- Loading skeleton -->
    <div v-if="loading" class="flex flex-col gap-1">
      <div v-for="i in 5" :key="i" class="h-12 bg-surface-hover rounded animate-pulse" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!rows || rows.length === 0" class="flex flex-col items-center justify-center gap-2 py-12 px-6 text-ink-tertiary">
      <UIcon name="i-heroicons-inbox" class="w-8 h-8 text-border-strong" />
      <span class="text-xs sm:text-[13px]">{{ emptyText || 'No records found.' }}</span>
    </div>

    <!-- Table -->
    <table v-else class="w-full border-collapse text-xs sm:text-[13px]">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="h-9 px-3 text-left text-[11px] font-bold text-ink-tertiary uppercase tracking-wider border-b border-border-subtle whitespace-nowrap"
            :class="col.align === 'right' ? 'text-right' : ''"
          >
            {{ col.label }}
          </th>
          <th v-if="$slots.actions" class="h-9 px-3 text-right text-[11px] font-bold text-ink-tertiary uppercase tracking-wider border-b border-border-subtle whitespace-nowrap">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="row.id ?? i"
          class="border-b border-border-subtle last:border-b-0 transition-colors"
          :class="onRowClick && 'cursor-pointer hover:bg-surface-hover'"
          @click="onRowClick && onRowClick(row)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="h-12 px-3 text-ink align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]"
            :class="col.align === 'right' ? 'text-right' : ''"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] ?? '—' }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="h-12 px-3 text-right text-ink align-middle whitespace-nowrap">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  columns: Array<{ key: string; label: string; align?: 'left' | 'right' }>
  rows:    any[]
  loading?: boolean
  emptyText?: string
  onRowClick?: (row: any) => void
}>(), {
  loading: false,
})
</script>
