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

  // Enforce ADMIN or MANAGER role
  const roles = authStore.user?.roles?.map((r: any) => r.name) ?? []
  if (!roles.some((r: string) => ['ADMIN', 'MANAGER'].includes(r))) {
    return navigateTo('/login')
  }
})
