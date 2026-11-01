// Admin auth middleware — restores session and enforces ADMIN or MANAGER role
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (process.client) {
    authStore.restoreSession()
    if (authStore.accessToken && !authStore.user) {
      await authStore.fetchCurrentUser()
    }
  }

  if (!authStore.accessToken) {
    return navigateTo('/login')
  }

  // Enforce ADMIN, MANAGER, or WAREHOUSE role
  const roles = authStore.user?.roles?.map((r: any) => r.name) ?? []
  if (!roles.some((r: string) => ['ADMIN', 'MANAGER', 'WAREHOUSE'].includes(r))) {
    await authStore.logout()
    return navigateTo('/login')
  }

  // Enforce strict Stock Manager portal route boundary
  const allowedPrefixes = [
    '/dashboard',
    '/inventory',
    '/products',
    '/labels',
    '/purchases',
    '/suppliers',
    '/reports/inventory',
    '/reports/purchases',
    '/settings',
    '/login',
  ]
  if (to.path !== '/' && !allowedPrefixes.some(prefix => to.path === prefix || to.path.startsWith(`${prefix}/`))) {
    return navigateTo('/dashboard')
  }
})
