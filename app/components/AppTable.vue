<!-- AppTable — high-density data table, Linear-style -->
<template>
  <div class="a-table-wrap">
    <!-- Loading skeleton -->
    <div v-if="loading" class="a-table-skeleton">
      <div v-for="i in 5" :key="i" class="a-skeleton-row" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!rows || rows.length === 0" class="a-table-empty">
      <UIcon name="i-heroicons-inbox" class="w-8 h-8" style="color:var(--border-strong);" />
      <span class="a-table-empty__text">{{ emptyText || 'No records found.' }}</span>
    </div>

    <!-- Table -->
    <table v-else class="a-table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="a-table__th"
            :class="col.align === 'right' ? 'a-table__th--right' : ''"
          >
            {{ col.label }}
          </th>
          <th v-if="$slots.actions" class="a-table__th a-table__th--right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="row.id ?? i"
          class="a-table__row"
          :class="onRowClick && 'a-table__row--clickable'"
          @click="onRowClick && onRowClick(row)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="a-table__td"
            :class="col.align === 'right' ? 'a-table__td--right' : ''"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] ?? '—' }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="a-table__td a-table__td--right">
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

<style scoped>
.a-table-wrap {
  overflow-x: auto;
}

.a-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.a-table__th {
  height: 36px;
  padding: 0 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.a-table__th--right { text-align: right; }

.a-table__row {
  border-bottom: 1px solid var(--border-subtle);
}

.a-table__row:last-child { border-bottom: none; }

.a-table__row--clickable { cursor: pointer; }
.a-table__row--clickable:hover { background: var(--surface-hover); }

.a-table__td {
  height: 48px;
  padding: 0 12px;
  color: var(--text-primary);
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}

.a-table__td--right { text-align: right; }

/* Loading skeleton */
.a-table-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.a-skeleton-row {
  height: 48px;
  background: var(--surface-hover);
  border-radius: 4px;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Empty */
.a-table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 24px;
  color: var(--text-tertiary);
}

.a-table-empty__text {
  font-size: 13px;
}
</style>
