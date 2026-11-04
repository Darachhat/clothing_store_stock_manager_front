// Stock Manager auth middleware — restores session and enforces ADMIN, MANAGER, or WAREHOUSE role
function isJwtExpired(token: string, bufferSeconds = 30): boolean {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return true
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
    return true
  }
  return false
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  authStore.restoreSession()

  if (!authStore.accessToken) {
    return navigateTo('/login', { replace: true })
  }

  if (isJwtExpired(authStore.accessToken, 15)) {
    const refreshed = await authStore.refreshSession()
    if (!refreshed || !authStore.accessToken) {
      authStore.clearLocalSession()
      return navigateTo('/login', { replace: true })
    }
  }

  let hasValidRole = false
  if (authStore.user) {
    const cachedRoles = authStore.user?.roles?.map((r: any) => r.name) ?? []
    if (cachedRoles.some((r: string) => ['ADMIN', 'MANAGER', 'WAREHOUSE'].includes(r))) {
      hasValidRole = true
      authStore.fetchCurrentUser().catch(() => {})
    }
  }

  if (!hasValidRole) {
    await authStore.fetchCurrentUser()

    if (!authStore.accessToken || !authStore.user) {
      authStore.clearLocalSession()
      return navigateTo('/login', { replace: true })
    }

    const roles = authStore.user?.roles?.map((r: any) => r.name) ?? []
    if (!roles.some((r: string) => ['ADMIN', 'MANAGER', 'WAREHOUSE'].includes(r))) {
      await authStore.logout()
      return navigateTo('/login', { replace: true })
    }
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
    return navigateTo('/dashboard', { replace: true })
  }
})
