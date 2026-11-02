// Centralized API Composable Facade for Stock Manager Frontend
// Integrates with app/api/client and app/api/endpoints while preserving 100% backward compatibility
import { createStockApiClient } from '~/api/client'
import { API_ENDPOINTS } from '~/api/endpoints'
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductVariant,
  ProductPagination,
  Category,
  Brand,
  Color,
  Size,
  Supplier,
  PurchaseOrder,
  Branch,
  Warehouse,
  DashboardData,
} from '~/types'

export function useApi() {
  const client = createStockApiClient()

  return {
    baseURL: client.baseURL,
    apiFetch: client.fetch,
    get: client.get,
    post: client.post,
    patch: client.patch,
    put: client.put,
    delete: client.delete,
  }
}

export function useProductApi() {
  const { apiFetch } = useApi()

  return {
    listProducts: (params?: Record<string, unknown>) =>
      apiFetch<ProductPagination>(API_ENDPOINTS.products.base, { params, query: params }),
    getProduct: (id: string) =>
      apiFetch<Product>(API_ENDPOINTS.products.detail(id)),
    createProduct: (body: ProductCreate | unknown) =>
      apiFetch<Product>(API_ENDPOINTS.products.base, { method: 'POST', body: body as any }),
    updateProduct: (id: string, body: ProductUpdate | unknown) =>
      apiFetch<Product>(API_ENDPOINTS.products.detail(id), { method: 'PUT', body: body as any }),
    deleteProduct: (id: string) =>
      apiFetch(API_ENDPOINTS.products.detail(id), { method: 'DELETE' }),
    getVariants: (productId: string) =>
      apiFetch<ProductVariant[]>(API_ENDPOINTS.products.variants(productId)),
    getVariantQr: (variantId: string, format: 'png' | 'svg' = 'svg') =>
      `${useRuntimeConfig().public.apiBase}${API_ENDPOINTS.products.qr(variantId, format)}`,
    getVariantBarcode: (variantId: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `${useRuntimeConfig().public.apiBase}${API_ENDPOINTS.products.barcode(variantId, format, writeText)}`,
    searchByQr: (ref: string) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.byQr(ref)),
    searchByBarcode: (barcode: string) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.byBarcode(barcode)),
    searchBySku: (sku: string) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.bySku(sku)),
  }
}

export function useInventoryApi() {
  const { apiFetch } = useApi()

  return {
    listStocks: (params?: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.inventory.stocks, { params, query: params }),
    listMovements: (params?: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.inventory.movements, { params, query: params }),
    createAdjustment: (body: unknown) =>
      apiFetch(API_ENDPOINTS.inventory.adjustments, { method: 'POST', body: body as any }),
    listTransfers: (params?: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.inventory.transfers, { params, query: params }),
    createTransfer: (body: unknown) =>
      apiFetch(API_ENDPOINTS.inventory.transfers, { method: 'POST', body: body as any }),
    approveTransfer: (id: string) =>
      apiFetch(API_ENDPOINTS.inventory.approveTransfer(id), { method: 'POST' }),
    dispatchTransfer: (id: string) =>
      apiFetch(API_ENDPOINTS.inventory.dispatchTransfer(id), { method: 'POST' }),
    receiveTransfer: (id: string) =>
      apiFetch(API_ENDPOINTS.inventory.receiveTransfer(id), { method: 'POST' }),
    cancelTransfer: (id: string) =>
      apiFetch(API_ENDPOINTS.inventory.cancelTransfer(id), { method: 'POST' }),
  }
}

export function usePurchaseApi() {
  const { apiFetch } = useApi()

  return {
    listOrders: (params?: Record<string, unknown>) =>
      apiFetch<PurchaseOrder[]>(API_ENDPOINTS.purchases.base, { params, query: params }),
    getOrder: (id: string) =>
      apiFetch<PurchaseOrder>(API_ENDPOINTS.purchases.detail(id)),
    createOrder: (body: unknown) =>
      apiFetch<PurchaseOrder>(API_ENDPOINTS.purchases.base, { method: 'POST', body: body as any }),
    updateOrder: (id: string, body: unknown) =>
      apiFetch<PurchaseOrder>(API_ENDPOINTS.purchases.detail(id), { method: 'PUT', body: body as any }),
    approveOrder: (id: string) =>
      apiFetch(API_ENDPOINTS.purchases.approve(id), { method: 'POST' }),
    cancelOrder: (id: string) =>
      apiFetch(API_ENDPOINTS.purchases.cancel(id), { method: 'POST' }),
    listReceipts: (orderId: string) =>
      apiFetch(API_ENDPOINTS.purchases.receipts(orderId)),
    createReceipt: (body: unknown) =>
      apiFetch('/api/admin/v1/purchases/receipts', { method: 'POST', body: body as any }),
  }
}

export function useCatalogApi() {
  const { apiFetch } = useApi()

  return {
    listCategories: (params?: Record<string, unknown>) =>
      apiFetch<Category[]>(API_ENDPOINTS.catalog.categories, { params, query: params }),
    createCategory: (body: unknown) =>
      apiFetch<Category>(API_ENDPOINTS.catalog.categories, { method: 'POST', body: body as any }),
    updateCategory: (id: string, body: unknown) =>
      apiFetch<Category>(API_ENDPOINTS.catalog.categoryDetail(id), { method: 'PUT', body: body as any }),
    deleteCategory: (id: string) =>
      apiFetch(API_ENDPOINTS.catalog.categoryDetail(id), { method: 'DELETE' }),

    listBrands: (params?: Record<string, unknown>) =>
      apiFetch<Brand[]>(API_ENDPOINTS.catalog.brands, { params, query: params }),
    createBrand: (body: unknown) =>
      apiFetch<Brand>(API_ENDPOINTS.catalog.brands, { method: 'POST', body: body as any }),
    updateBrand: (id: string, body: unknown) =>
      apiFetch<Brand>(API_ENDPOINTS.catalog.brandDetail(id), { method: 'PUT', body: body as any }),
    deleteBrand: (id: string) =>
      apiFetch(API_ENDPOINTS.catalog.brandDetail(id), { method: 'DELETE' }),

    listColors: (params?: Record<string, unknown>) =>
      apiFetch<Color[]>(API_ENDPOINTS.catalog.colors, { params, query: params }),
    createColor: (body: unknown) =>
      apiFetch<Color>(API_ENDPOINTS.catalog.colors, { method: 'POST', body: body as any }),
    updateColor: (id: string, body: unknown) =>
      apiFetch<Color>(API_ENDPOINTS.catalog.colorDetail(id), { method: 'PUT', body: body as any }),
    deleteColor: (id: string) =>
      apiFetch(API_ENDPOINTS.catalog.colorDetail(id), { method: 'DELETE' }),

    listSizes: (params?: Record<string, unknown>) =>
      apiFetch<Size[]>(API_ENDPOINTS.catalog.sizes, { params, query: params }),
    createSize: (body: unknown) =>
      apiFetch<Size>(API_ENDPOINTS.catalog.sizes, { method: 'POST', body: body as any }),
    updateSize: (id: string, body: unknown) =>
      apiFetch<Size>(API_ENDPOINTS.catalog.sizeDetail(id), { method: 'PUT', body: body as any }),
    deleteSize: (id: string) =>
      apiFetch(API_ENDPOINTS.catalog.sizeDetail(id), { method: 'DELETE' }),
  }
}

export function useVariantApi() {
  const { apiFetch } = useApi()

  return {
    listVariants: (params?: Record<string, unknown>) =>
      apiFetch<ProductVariant[]>(API_ENDPOINTS.products.base + '/variants', { params, query: params }),
    getVariant: (id: string) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.variantDetail(id)),
    createVariant: (body: unknown) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.base + '/variants', { method: 'POST', body: body as any }),
    updateVariant: (id: string, body: unknown) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.variantDetail(id), { method: 'PUT', body: body as any }),
    deleteVariant: (id: string) =>
      apiFetch(API_ENDPOINTS.products.variantDetail(id), { method: 'DELETE' }),
    getQrUrl: (id: string, format: 'png' | 'svg' = 'svg') =>
      `${useRuntimeConfig().public.apiBase}${API_ENDPOINTS.products.qr(id, format)}`,
    getBarcodeUrl: (id: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `${useRuntimeConfig().public.apiBase}${API_ENDPOINTS.products.barcode(id, format, writeText)}`,
  }
}

export function useSupplierApi() {
  const { apiFetch } = useApi()

  return {
    listSuppliers: (params?: Record<string, unknown>) =>
      apiFetch<Supplier[]>(API_ENDPOINTS.catalog.suppliers, { params, query: params }),
    getSupplier: (id: string) =>
      apiFetch<Supplier>(API_ENDPOINTS.catalog.supplierDetail(id)),
    createSupplier: (body: unknown) =>
      apiFetch<Supplier>(API_ENDPOINTS.catalog.suppliers, { method: 'POST', body: body as any }),
    updateSupplier: (id: string, body: unknown) =>
      apiFetch<Supplier>(API_ENDPOINTS.catalog.supplierDetail(id), { method: 'PUT', body: body as any }),
    deleteSupplier: (id: string) =>
      apiFetch(API_ENDPOINTS.catalog.supplierDetail(id), { method: 'DELETE' }),
  }
}

export function useBranchApi() {
  const { apiFetch } = useApi()

  return {
    listBranches: () =>
      apiFetch<Branch[]>(API_ENDPOINTS.branches.base),
    updateBranch: (id: string, body: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.branches.detail(id), { method: 'PATCH', body }),
    createBranch: (body: { code: string; name: string; address?: string; phone?: string; email?: string }) =>
      apiFetch(API_ENDPOINTS.branches.base, { method: 'POST', body }),
    listWarehouses: (branchId?: string) =>
      apiFetch<Warehouse[]>(API_ENDPOINTS.branches.warehouses, branchId ? { params: { branch_id: branchId }, query: { branch_id: branchId } } : undefined),
    createWarehouse: (body: { branch_id: string; name: string; location?: string; is_default?: boolean }) =>
      apiFetch(API_ENDPOINTS.branches.warehouses, { method: 'POST', body }),
  }
}

export function useLabelApi() {
  const { apiFetch } = useApi()

  return {
    generateLabels: (body: unknown) =>
      apiFetch<Blob>(API_ENDPOINTS.labels.generate, { method: 'POST', body: body as any, responseType: 'blob' as any }),
    downloadLabels: (body: unknown) =>
      apiFetch<Blob>(API_ENDPOINTS.labels.generate, { method: 'POST', body: body as any, responseType: 'blob' as any }),
  }
}

export function useReportApi() {
  const { apiFetch } = useApi()

  return {
    getDashboard: (period?: string) =>
      apiFetch<DashboardData>(API_ENDPOINTS.reports.dashboard, { params: { period }, query: { period } }),
    getWarehouseDashboard: (period?: string) =>
      apiFetch('/api/admin/v1/reports/warehouse-dashboard', { params: { period }, query: { period } }),
    getInventoryReport: (params: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.reports.inventory, { params, query: params }),
    getPurchasesReport: (params: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.reports.purchases, { params, query: params }),
  }
}

export function useSaleApi() {
  const { apiFetch } = useApi()
  return {
    listSales: (params?: Record<string, unknown>) => apiFetch('/api/admin/v1/sales', { params, query: params }),
    getSale: (id: string) => apiFetch(`/api/admin/v1/sales/${id}`),
    createSale: (body: unknown) => apiFetch('/api/admin/v1/sales', { method: 'POST', body: body as any }),
    completeSale: (id: string, body?: unknown) => apiFetch(`/api/admin/v1/sales/${id}/complete`, { method: 'POST', body: body as any }),
    cancelSale: (id: string) => apiFetch(`/api/admin/v1/sales/${id}/cancel`, { method: 'POST' }),
    listReturns: (params?: Record<string, unknown>) => apiFetch('/api/admin/v1/returns', { params, query: params }),
    createReturn: (body: unknown) => apiFetch('/api/admin/v1/returns', { method: 'POST', body: body as any }),
  }
}

export function useCustomerApi() {
  const { apiFetch } = useApi()
  return {
    listCustomers: (params?: Record<string, unknown>) => apiFetch('/api/admin/v1/customers', { params, query: params }),
    getCustomer: (id: string) => apiFetch(`/api/admin/v1/customers/${id}`),
    createCustomer: (body: unknown) => apiFetch('/api/admin/v1/customers', { method: 'POST', body: body as any }),
    updateCustomer: (id: string, body: unknown) => apiFetch(`/api/admin/v1/customers/${id}`, { method: 'PUT', body: body as any }),
  }
}

export function useExpenseApi() {
  const { apiFetch } = useApi()
  return {
    listCategories: () => apiFetch('/api/admin/v1/expenses/categories'),
    listExpenses: (params?: Record<string, unknown>) => apiFetch('/api/admin/v1/expenses', { params, query: params }),
  }
}

export function usePromotionApi() {
  const { apiFetch } = useApi()
  return {
    listPromotions: (params?: Record<string, unknown>) => apiFetch('/api/admin/v1/promotions', { params, query: params }),
  }
}

export function useUserApi() {
  const { apiFetch } = useApi()
  return {
    listUsers: (params?: Record<string, unknown>) => apiFetch('/api/admin/v1/users', { params, query: params }),
    getUser: (id: string) => apiFetch(`/api/admin/v1/users/${id}`),
    listRoles: () => apiFetch('/api/admin/v1/roles'),
    listPermissions: () => apiFetch('/api/admin/v1/roles/permissions'),
  }
}
