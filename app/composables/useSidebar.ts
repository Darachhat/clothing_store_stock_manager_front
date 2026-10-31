export interface NavItem {
  label: string
  to: string
  icon: string
  shortcut?: string
  badge?: string | number
  railPrimary?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const APP_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Stock Dashboard', to: '/dashboard', icon: 'i-heroicons-chart-bar-square', railPrimary: true },
    ],
  },
  {
    title: 'Warehouse & Stock',
    items: [
      { label: 'Stock Levels', to: '/inventory', icon: 'i-heroicons-cube', railPrimary: true },
      { label: 'Movements', to: '/inventory/movements', icon: 'i-heroicons-arrows-right-left', railPrimary: true },
      { label: 'Transfers', to: '/inventory/transfers', icon: 'i-heroicons-truck', railPrimary: true },
      { label: 'Adjustments', to: '/inventory/adjustments', icon: 'i-heroicons-adjustments-horizontal' },
    ],
  },
  {
    title: 'Catalog & Labels',
    items: [
      { label: 'Products & SKUs', to: '/products', icon: 'i-heroicons-tag', railPrimary: true },
      { label: 'Print Labels', to: '/labels', icon: 'i-heroicons-qr-code', railPrimary: true },
    ],
  },
  {
    title: 'Purchasing & Receiving',
    items: [
      { label: 'Purchase Orders', to: '/purchases', icon: 'i-heroicons-document-text', railPrimary: true },
      { label: 'Suppliers', to: '/suppliers', icon: 'i-heroicons-building-office-2' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Inventory Report', to: '/reports/inventory', icon: 'i-heroicons-clipboard-document-list' },
      { label: 'Purchases Report', to: '/reports/purchases', icon: 'i-heroicons-document-text' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', to: '/settings', icon: 'i-heroicons-cog-6-tooth' },
    ],
  },
]

export function useSidebar() {
  const isCollapsed = useState<boolean>('app_sidebar_collapsed', () => false)

  function toggle() {
    isCollapsed.value = !isCollapsed.value
  }

  function collapse() {
    isCollapsed.value = true
  }

  function expand() {
    isCollapsed.value = false
  }

  return {
    isCollapsed,
    navSections: APP_NAV_SECTIONS,
    toggle,
    collapse,
    expand,
  }
}
