// Auth store — manages JWT tokens and current user
import { defineStore } from 'pinia'
import { API_ENDPOINTS } from '~/api/endpoints'
import type { User } from '~/types/api.generated'

export interface AuthUser extends User {
  branch?: { id?: string; name?: string } | null
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
}

let cachedApiBase: string | null = null

function getApiBase(): string {
  if (cachedApiBase) return cachedApiBase
  const config = useRuntimeConfig()
  const base = String(import.meta.server ? config.apiBase : (config.public?.apiBase || '/api/proxy')).trim()
  cachedApiBase = base || '/api/proxy'
  return cachedApiBase
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    currentUser: (state) => state.user,
    permissions: (state): Set<string> => {
      const perms = new Set<string>()
      state.user?.roles?.forEach((role) => {
        role.permissions?.forEach((p) => perms.add(p.code))
      })
      return perms
    },
    hasPermission: (state) => (code: string): boolean => {
      return state.user?.roles?.some((r) =>
        r.permissions?.some((p) => p.code === code)
      ) ?? false
    },
    isAdmin: (state): boolean =>
      state.user?.roles?.some((r) => r.name === 'ADMIN') ?? false,
  },

  actions: {
    async login(username: string, password: string) {
      const data = await $fetch<{
        access_token: string
        refresh_token: string
        user: AuthUser
      }>(API_ENDPOINTS.auth.login, {
        baseURL: getApiBase(),
        method: 'POST',
        body: { username, password },
        timeout: 12000,
      })

      this.accessToken = data.access_token
      this.$state.refreshToken = data.refresh_token
      this.user = data.user

      if (typeof window !== 'undefined') {
        localStorage.setItem('stock_access_token', data.access_token)
        localStorage.setItem('stock_refresh_token', data.refresh_token)
        try {
          localStorage.setItem('stock_user', JSON.stringify(data.user))
        } catch {}
      }
    },

    async getTelegramConfig(): Promise<{ enabled: boolean; bot_username?: string | null }> {
      try {
        return await $fetch<{ enabled: boolean; bot_username?: string | null }>(
          API_ENDPOINTS.auth.telegramConfig,
          {
            baseURL: getApiBase(),
            method: 'GET',
            timeout: 6000,
          }
        )
      } catch {
        return { enabled: false, bot_username: null }
      }
    },

    async loginWithTelegram(payload: Record<string, unknown>) {
      const data = await $fetch<{
        access_token: string
        refresh_token: string
        user: AuthUser
      }>(API_ENDPOINTS.auth.telegramLogin, {
        baseURL: getApiBase(),
        method: 'POST',
        body: payload,
        timeout: 12000,
      })

      this.accessToken = data.access_token
      this.$state.refreshToken = data.refresh_token
      this.user = data.user

      if (typeof window !== 'undefined') {
        localStorage.setItem('stock_access_token', data.access_token)
        localStorage.setItem('stock_refresh_token', data.refresh_token)
        try {
          localStorage.setItem('stock_user', JSON.stringify(data.user))
        } catch {}
      }
    },

    async linkTelegram(payload: Record<string, unknown>): Promise<AuthUser> {
      const updated = await $fetch<AuthUser>(API_ENDPOINTS.auth.telegramLink, {
        baseURL: getApiBase(),
        method: 'POST',
        headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : undefined,
        body: payload,
        timeout: 10000,
      })
      this.user = updated
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('stock_user', JSON.stringify(updated))
        } catch {}
      }
      return updated
    },

    async unlinkTelegram(): Promise<AuthUser> {
      const updated = await $fetch<AuthUser>(API_ENDPOINTS.auth.telegramLink, {
        baseURL: getApiBase(),
        method: 'DELETE',
        headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : undefined,
        timeout: 10000,
      })
      this.user = updated
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('stock_user', JSON.stringify(updated))
        } catch {}
      }
      return updated
    },

    async requestPhoneVerification(phoneNumber: string) {
      return await $fetch<{
        message: string
        normalized_phone: string
        expires_in_seconds: number
        delivery_channel: string
      }>(API_ENDPOINTS.auth.phoneRequestVerification, {
        baseURL: getApiBase(),
        method: 'POST',
        headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : undefined,
        body: { phone_number: phoneNumber },
        timeout: 10000,
      })
    },

    async verifyPhone(phoneNumber: string, otpCode: string): Promise<AuthUser> {
      const updated = await $fetch<AuthUser>(API_ENDPOINTS.auth.phoneVerify, {
        baseURL: getApiBase(),
        method: 'POST',
        headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : undefined,
        body: { phone_number: phoneNumber, otp_code: otpCode },
        timeout: 10000,
      })
      this.user = updated
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('stock_user', JSON.stringify(updated))
        } catch {}
      }
      return updated
    },

    async refreshSession(): Promise<boolean> {
      const currentRefresh =
        this.$state.refreshToken ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('stock_refresh_token') || localStorage.getItem('refresh_token')
          : null)
      if (!currentRefresh) return false
      try {
        const data = await $fetch<{
          access_token: string
          refresh_token: string
        }>(API_ENDPOINTS.auth.refresh, {
          baseURL: getApiBase(),
          method: 'POST',
          body: { refresh_token: currentRefresh },
          timeout: 8000,
        })
        this.accessToken = data.access_token
        this.$state.refreshToken = data.refresh_token
        if (typeof window !== 'undefined') {
          localStorage.setItem('stock_access_token', data.access_token)
          localStorage.setItem('stock_refresh_token', data.refresh_token)
        }
        return true
      } catch {
        return false
      }
    },

    clearLocalSession() {
      this.user = null
      this.accessToken = null
      this.$state.refreshToken = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('stock_access_token')
        localStorage.removeItem('stock_refresh_token')
        localStorage.removeItem('stock_user')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    },

    async logout() {
      const currentRefresh =
        this.$state.refreshToken ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('stock_refresh_token') || localStorage.getItem('refresh_token')
          : null)
      const currentAccess = this.accessToken

      // Clear local state and localStorage IMMEDIATELY before network call
      this.clearLocalSession()

      if (currentRefresh) {
        try {
          await $fetch(API_ENDPOINTS.auth.logout, {
            baseURL: getApiBase(),
            method: 'POST',
            body: { refresh_token: currentRefresh },
            headers: currentAccess ? { Authorization: `Bearer ${currentAccess}` } : undefined,
            timeout: 4000,
          })
        } catch {}
      }
    },

    restoreSession() {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('stock_access_token') || localStorage.getItem('access_token')
        const refresh = localStorage.getItem('stock_refresh_token') || localStorage.getItem('refresh_token')
        if (token) this.accessToken = token
        if (refresh) this.$state.refreshToken = refresh
        if (!this.user) {
          const cachedUser = localStorage.getItem('stock_user')
          if (cachedUser) {
            try {
              this.user = JSON.parse(cachedUser)
            } catch {}
          }
        }
      }
    },

    async fetchCurrentUser() {
      if (!this.accessToken) {
        this.restoreSession()
      }
      if (!this.accessToken) return
      try {
        const user = await $fetch<AuthUser>(API_ENDPOINTS.auth.me, {
          baseURL: getApiBase(),
          headers: { Authorization: `Bearer ${this.accessToken}` },
          timeout: 8000,
        })
        this.user = user
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('stock_user', JSON.stringify(user))
          } catch {}
        }
      } catch {
        const ok = await this.refreshSession()
        if (ok && this.accessToken) {
          try {
            const user = await $fetch<AuthUser>(API_ENDPOINTS.auth.me, {
              baseURL: getApiBase(),
              headers: { Authorization: `Bearer ${this.accessToken}` },
              timeout: 8000,
            })
            this.user = user
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem('stock_user', JSON.stringify(user))
              } catch {}
            }
            return
          } catch {}
        }
        await this.logout()
      }
    },
  },
})
