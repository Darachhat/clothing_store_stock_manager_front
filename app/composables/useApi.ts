// Helper to decode JWT payload safely
function isJwtExpired(token: string, bufferSeconds = 30): boolean {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return false
    const base64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonStr)
    if (typeof payload.exp === 'number') {
      return Date.now() >= (payload.exp - bufferSeconds) * 1000
    }
  } catch {
    // If decoding fails, assume not expired and let backend handle
  }
  return false
}

// Centralized API composable — wraps $fetch with auth headers, SSR-safe base URL, and token refresh
export function useApi() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const baseURL = (import.meta.server
    ? (config.apiBase || 'http://backend:8000')
    : config.public.apiBase) as string

  const apiFetch = $fetch.create({
    baseURL,
    retry: 1,
    retryStatusCodes: [401],
    async onRequest({ options }) {
      if (!authStore.accessToken && typeof window !== 'undefined') {
        authStore.restoreSession()
      }
      let token = authStore.accessToken || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)

      if (typeof window !== 'undefined') {
        const hasRefresh = !!(authStore.$state.refreshToken || localStorage.getItem('refresh_token'))
        if (hasRefresh && (!token || isJwtExpired(token, 30))) {
          const ok = await authStore.refreshSession()
          if (ok && authStore.accessToken) {
            token = authStore.accessToken
          }
        }
      }

      const headers = new Headers(options.headers || {})
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      options.headers = headers
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        const refreshed = await authStore.refreshSession()
        if (!refreshed) {
          authStore.logout()
          await navigateTo('/login')
        }
      }
    },
  })

  return {
    baseURL,
    apiFetch,
    get: <T = any>(url: string, params?: Record<string, unknown>) =>
      apiFetch<T>(url, { params, query: params }),
    post: <T = any>(url: string, body?: unknown) =>
      apiFetch<T>(url, { method: 'POST', body: body as any }),
    patch: <T = any>(url: string, body?: unknown) =>
      apiFetch<T>(url, { method: 'PATCH', body: body as any }),
    put: <T = any>(url: string, body?: unknown) =>
      apiFetch<T>(url, { method: 'PUT', body: body as any }),
    delete: <T = any>(url: string) =>
      apiFetch<T>(url, { method: 'DELETE' }),
  }
}


// Typed Domain API Helpers (all targeting /api/admin/v1/*)
export function useProductApi() {
  const { apiFetch } = useApi()

  return {
    listProducts: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/products', { params, query: params }),
    getProduct: (id: string) =>
      apiFetch(`/api/admin/v1/products/${id}`),
    createProduct: (body: unknown) =>
      apiFetch('/api/admin/v1/products', { method: 'POST', body: body as any }),
    updateProduct: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/products/${id}`, { method: 'PUT', body: body as any }),
    deleteProduct: (id: string) =>
      apiFetch(`/api/admin/v1/products/${id}`, { method: 'DELETE' }),
    getVariants: (productId: string) =>
      apiFetch(`/api/admin/v1/products/${productId}/variants`),
    getVariantQr: (variantId: string, format: 'png' | 'svg' = 'svg') =>
      `${useRuntimeConfig().public.apiBase}/api/v1/product-variants/${variantId}/qr?format=${format}`,
    getVariantBarcode: (variantId: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `${useRuntimeConfig().public.apiBase}/api/v1/product-variants/${variantId}/barcode?format=${format}&write_text=${writeText}`,
    searchByQr: (ref: string) =>
      apiFetch(`/api/admin/v1/product-variants/by-qr/${ref}`),
    searchByBarcode: (barcode: string) =>
      apiFetch(`/api/admin/v1/product-variants/by-barcode/${barcode}`),
    searchBySku: (sku: string) =>
      apiFetch(`/api/admin/v1/product-variants/by-sku/${sku}`),
  }
}

export function useSaleApi() {
  const { apiFetch } = useApi()

  return {
    listSales: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/sales', { params, query: params }),
    getSale: (id: string) =>
      apiFetch(`/api/admin/v1/sales/${id}`),
    createSale: (body: unknown) =>
      apiFetch('/api/admin/v1/sales', { method: 'POST', body: body as any }),
    completeSale: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/sales/${id}/complete`, { method: 'POST', body: body as any }),
    cancelSale: (id: string) =>
      apiFetch(`/api/admin/v1/sales/${id}/cancel`, { method: 'POST' }),
    listReturns: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/returns', { params, query: params }),
    createReturn: (body: unknown) =>
      apiFetch('/api/admin/v1/returns', { method: 'POST', body: body as any }),
  }
}

export function useInventoryApi() {
  const { apiFetch } = useApi()

  return {
    listStocks: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/inventory/stocks', { params, query: params }),
    listMovements: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/inventory/movements', { params, query: params }),
    createAdjustment: (body: unknown) =>
      apiFetch('/api/admin/v1/inventory/adjustments', { method: 'POST', body: body as any }),
    listTransfers: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/inventory/transfers', { params, query: params }),
    createTransfer: (body: unknown) =>
      apiFetch('/api/admin/v1/inventory/transfers', { method: 'POST', body: body as any }),
    approveTransfer: (id: string) =>
      apiFetch(`/api/admin/v1/inventory/transfers/${id}/approve`, { method: 'POST' }),
    dispatchTransfer: (id: string) =>
      apiFetch(`/api/admin/v1/inventory/transfers/${id}/dispatch`, { method: 'POST' }),
    receiveTransfer: (id: string) =>
      apiFetch(`/api/admin/v1/inventory/transfers/${id}/receive`, { method: 'POST' }),
    cancelTransfer: (id: string) =>
      apiFetch(`/api/admin/v1/inventory/transfers/${id}/cancel`, { method: 'POST' }),
  }
}

export function useReportApi() {
  const { apiFetch } = useApi()

  return {
    getDashboard: (period?: string) =>
      apiFetch('/api/admin/v1/reports/dashboard', { params: { period }, query: { period } }),
    getSalesReport: (params: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/reports/sales', { params, query: params }),
    getInventoryReport: (params: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/reports/inventory', { params, query: params }),
    getPurchasesReport: (params: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/reports/purchases', { params, query: params }),
    getProfitReport: (params: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/reports/profit', { params, query: params }),
  }
}

export function useCatalogApi() {
  const { apiFetch } = useApi()

  return {
    // Categories
    listCategories: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/categories', { params, query: params }),
    createCategory: (body: unknown) =>
      apiFetch('/api/admin/v1/categories', { method: 'POST', body: body as any }),
    updateCategory: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/categories/${id}`, { method: 'PUT', body: body as any }),
    deleteCategory: (id: string) =>
      apiFetch(`/api/admin/v1/categories/${id}`, { method: 'DELETE' }),
    // Brands
    listBrands: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/brands', { params, query: params }),
    createBrand: (body: unknown) =>
      apiFetch('/api/admin/v1/brands', { method: 'POST', body: body as any }),
    updateBrand: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/brands/${id}`, { method: 'PUT', body: body as any }),
    deleteBrand: (id: string) =>
      apiFetch(`/api/admin/v1/brands/${id}`, { method: 'DELETE' }),
    // Colors
    listColors: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/colors', { params, query: params }),
    createColor: (body: unknown) =>
      apiFetch('/api/admin/v1/colors', { method: 'POST', body: body as any }),
    updateColor: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/colors/${id}`, { method: 'PUT', body: body as any }),
    deleteColor: (id: string) =>
      apiFetch(`/api/admin/v1/colors/${id}`, { method: 'DELETE' }),
    // Sizes
    listSizes: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/sizes', { params, query: params }),
    createSize: (body: unknown) =>
      apiFetch('/api/admin/v1/sizes', { method: 'POST', body: body as any }),
    updateSize: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/sizes/${id}`, { method: 'PUT', body: body as any }),
    deleteSize: (id: string) =>
      apiFetch(`/api/admin/v1/sizes/${id}`, { method: 'DELETE' }),
  }
}

export function useVariantApi() {
  const { apiFetch } = useApi()

  return {
    listVariants: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/product-variants', { params, query: params }),
    getVariant: (id: string) =>
      apiFetch(`/api/admin/v1/product-variants/${id}`),
    createVariant: (body: unknown) =>
      apiFetch('/api/admin/v1/product-variants', { method: 'POST', body: body as any }),
    updateVariant: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/product-variants/${id}`, { method: 'PUT', body: body as any }),
    deleteVariant: (id: string) =>
      apiFetch(`/api/admin/v1/product-variants/${id}`, { method: 'DELETE' }),
    getQrUrl: (id: string, format: 'png' | 'svg' = 'svg') =>
      `${useRuntimeConfig().public.apiBase}/api/v1/product-variants/${id}/qr?format=${format}`,
    getBarcodeUrl: (id: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `${useRuntimeConfig().public.apiBase}/api/v1/product-variants/${id}/barcode?format=${format}&write_text=${writeText}`,
  }
}

export function useCustomerApi() {
  const { apiFetch } = useApi()

  return {
    listCustomers: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/customers', { params, query: params }),
    getCustomer: (id: string) =>
      apiFetch(`/api/admin/v1/customers/${id}`),
    createCustomer: (body: unknown) =>
      apiFetch('/api/admin/v1/customers', { method: 'POST', body: body as any }),
    updateCustomer: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/customers/${id}`, { method: 'PUT', body: body as any }),
    adjustPoints: (id: string, body: { points: number; note?: string }) =>
      apiFetch(`/api/admin/v1/customers/${id}/points`, { method: 'POST', body }),
  }
}

export function useSupplierApi() {
  const { apiFetch } = useApi()

  return {
    listSuppliers: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/suppliers', { params, query: params }),
    getSupplier: (id: string) =>
      apiFetch(`/api/admin/v1/suppliers/${id}`),
    createSupplier: (body: unknown) =>
      apiFetch('/api/admin/v1/suppliers', { method: 'POST', body: body as any }),
    updateSupplier: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/suppliers/${id}`, { method: 'PUT', body: body as any }),
    deleteSupplier: (id: string) =>
      apiFetch(`/api/admin/v1/suppliers/${id}`, { method: 'DELETE' }),
  }
}

export function usePurchaseApi() {
  const { apiFetch } = useApi()

  return {
    listOrders: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/purchases', { params, query: params }),
    getOrder: (id: string) =>
      apiFetch(`/api/admin/v1/purchases/${id}`),
    createOrder: (body: unknown) =>
      apiFetch('/api/admin/v1/purchases', { method: 'POST', body: body as any }),
    updateOrder: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/purchases/${id}`, { method: 'PATCH', body: body as any }),
    approveOrder: (id: string) =>
      apiFetch(`/api/admin/v1/purchases/${id}/approve`, { method: 'POST' }),
    cancelOrder: (id: string) =>
      apiFetch(`/api/admin/v1/purchases/${id}/cancel`, { method: 'POST' }),
    // Goods receipts
    listReceipts: (orderId: string) =>
      apiFetch(`/api/admin/v1/purchases/${orderId}/receipts`),
    createReceipt: (body: unknown) =>
      apiFetch('/api/admin/v1/purchases/receipts', { method: 'POST', body: body as any }),
  }
}

export function useExpenseApi() {
  const { apiFetch } = useApi()

  return {
    listCategories: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/expenses/categories', { params, query: params }),
    createCategory: (body: unknown) =>
      apiFetch('/api/admin/v1/expenses/categories', { method: 'POST', body: body as any }),
    updateCategory: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/expenses/categories/${id}`, { method: 'PATCH', body: body as any }),
    listExpenses: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/expenses', { params, query: params }),
    getExpense: (id: string) =>
      apiFetch(`/api/admin/v1/expenses/${id}`),
    createExpense: (body: unknown) =>
      apiFetch('/api/admin/v1/expenses', { method: 'POST', body: body as any }),
    updateExpense: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/expenses/${id}`, { method: 'PATCH', body: body as any }),
    approveExpense: (id: string) =>
      apiFetch(`/api/admin/v1/expenses/${id}/approve`, { method: 'POST' }),
    rejectExpense: (id: string) =>
      apiFetch(`/api/admin/v1/expenses/${id}/reject`, { method: 'POST' }),
  }
}

export function usePromotionApi() {
  const { apiFetch } = useApi()

  return {
    listPromotions: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/promotions', { params, query: params }),
    validateCoupon: (body: { code: string; cart_total: number }) =>
      apiFetch('/api/admin/v1/promotions/validate', { method: 'POST', body }),
    getPromotion: (id: string) =>
      apiFetch(`/api/admin/v1/promotions/${id}`),
    createPromotion: (body: unknown) =>
      apiFetch('/api/admin/v1/promotions', { method: 'POST', body: body as any }),
    updatePromotion: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/promotions/${id}`, { method: 'PATCH', body: body as any }),
    deletePromotion: (id: string) =>
      apiFetch(`/api/admin/v1/promotions/${id}`, { method: 'DELETE' }),
  }
}

export function useLabelApi() {
  const { apiFetch } = useApi()

  return {
    generateLabels: (body: unknown) =>
      apiFetch<Blob>('/api/admin/v1/labels/generate', { method: 'POST', body: body as any, responseType: 'blob' as any }),
    downloadLabels: (body: unknown) =>
      apiFetch<Blob>('/api/admin/v1/labels/generate', { method: 'POST', body: body as any, responseType: 'blob' as any }),
  }
}

export function useUserApi() {
  const { apiFetch } = useApi()

  return {
    listUsers: (params?: Record<string, unknown>) =>
      apiFetch('/api/admin/v1/users', { params, query: params }),
    getUser: (id: string) =>
      apiFetch(`/api/admin/v1/users/${id}`),
    createUser: (body: unknown) =>
      apiFetch('/api/admin/v1/users', { method: 'POST', body: body as any }),
    updateUser: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/users/${id}`, { method: 'PATCH', body: body as any }),
    deleteUser: (id: string) =>
      apiFetch(`/api/admin/v1/users/${id}`, { method: 'DELETE' }),
    listRoles: () =>
      apiFetch('/api/admin/v1/roles'),
    createRole: (body: unknown) =>
      apiFetch('/api/admin/v1/roles', { method: 'POST', body: body as any }),
    updateRole: (id: string, body: unknown) =>
      apiFetch(`/api/admin/v1/roles/${id}`, { method: 'PATCH', body: body as any }),
    listPermissions: () =>
      apiFetch('/api/admin/v1/roles/permissions'),
  }
}

export function useBranchApi() {
  const { apiFetch } = useApi()

  return {
    listBranches: () =>
      apiFetch<Array<{
        id: string
        code: string
        name: string
        address?: string
        phone?: string
        status: string
        warehouses: Array<{
          id: string
          branch_id: string
          name: string
          is_default: boolean
          status: string
        }>
      }>>('/api/admin/v1/branches/'),
  }
}
