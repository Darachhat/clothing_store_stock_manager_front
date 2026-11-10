<template>
  <div class="flex min-h-dvh bg-surface-bg">
    <!-- Left panel: branding -->
    <div class="hidden md:flex flex-col justify-center w-[380px] min-w-[380px] bg-brand-900 border-r border-border-subtle p-8 lg:p-12 text-white">
      <div class="flex flex-col gap-6">
        <div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
          <UIcon name="i-heroicons-cube" class="w-6 h-6 text-white" />
        </div>
        <div>
          <div class="text-xl lg:text-2xl font-bold tracking-tight text-white">{{ config.public.appName }}</div>
        </div>
        <p class="text-xs lg:text-sm text-white/60 leading-relaxed max-w-[52ch]">
          Stock &amp; Warehouse Manager portal. Full access to inventory levels, transfers, purchase receiving, and barcode/QR labels.
        </p>
        <div class="flex flex-col gap-2.5 mt-2">
          <div v-for="feat in features" :key="feat" class="flex items-center gap-2.5 text-xs text-white/80">
            <UIcon name="i-heroicons-check" class="w-3.5 h-3.5 text-white stroke-[2.5]" />
            {{ feat }}
          </div>
        </div>
      </div>
    </div>

    <!-- Right panel: form -->
    <div class="flex-1 flex items-center justify-center p-4 sm:p-8 bg-surface-bg">
      <div class="w-full max-w-[360px] flex flex-col gap-5">
        <div class="flex flex-col gap-1">
          <h1 class="text-xl font-bold text-ink tracking-tight">Stock Manager Sign In</h1>
          <p class="text-xs text-ink-secondary mt-1">Enter your warehouse, manager, or admin credentials.</p>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
          <div class="flex flex-col gap-1.5 relative">
            <label class="text-xs font-semibold text-ink-secondary tracking-wide" for="username">Username or Verified Phone</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="h-10 px-3 text-xs sm:text-sm text-ink bg-surface-card border border-border-default rounded-md outline-none focus:border-ink transition-colors"
              placeholder="warehouse or +85569382165"
              autocomplete="username"
              autofocus
              required
            />
          </div>

          <div class="flex flex-col gap-1.5 relative">
            <label class="text-xs font-semibold text-ink-secondary tracking-wide" for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="h-10 pl-3 pr-10 text-xs sm:text-sm text-ink bg-surface-card border border-border-default rounded-md outline-none focus:border-ink transition-colors"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="absolute right-2.5 top-[29px] p-1 text-ink-tertiary hover:text-ink transition-colors cursor-pointer border-none bg-transparent"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <UIcon v-if="!showPassword" name="i-heroicons-eye" class="w-4 h-4" />
              <UIcon v-else name="i-heroicons-eye-slash" class="w-4 h-4" />
            </button>
          </div>

          <div v-if="errorMsg" class="p-2.5 rounded-md text-xs font-medium bg-status-red-bg text-status-red flex items-center gap-2 border border-border-subtle">
            <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 flex-shrink-0" />
            {{ errorMsg }}
          </div>

          <button type="submit" class="h-10 px-4 rounded-md font-semibold text-xs sm:text-sm bg-ink text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity flex items-center justify-center gap-2 border-none" :disabled="loading">
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 text-white animate-spin" />
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <div class="flex items-center gap-3 my-1 text-xs text-ink-tertiary before:content-[''] before:flex-1 before:h-px before:bg-border-subtle after:content-[''] after:flex-1 after:h-px after:bg-border-subtle">
          <span>or</span>
        </div>

        <div class="flex flex-col gap-3">
          <button
            type="button"
            class="w-full h-10 px-4 rounded-md text-xs font-semibold bg-surface-card border border-border-default hover:bg-surface-hover text-ink flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            :disabled="loading || appChallengeActive"
            @click="startTelegramAppLogin"
          >
            <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4" />
            <span>{{ appChallengeActive ? 'Waiting for Telegram App...' : 'Log in with Telegram App' }}</span>
          </button>

          <div v-if="appChallengeActive" class="p-3 rounded-md bg-surface-card border border-border-subtle flex flex-col gap-2">
            <div class="flex items-center gap-2 text-xs font-medium text-ink">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>{{ appChallengeMessage || 'Confirm login in your Telegram App (@clothing_store_kvm_bot)...' }}</span>
            </div>
            <div class="flex items-center gap-2 pt-1">
              <a
                v-if="appChallengeWebUrl"
                :href="appChallengeWebUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 h-8.5 px-3 rounded text-xs font-medium bg-surface-card border border-border-default hover:bg-surface-hover text-ink flex items-center justify-center gap-1.5 no-underline transition-colors"
              >
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                <span>Open in Telegram</span>
              </a>
              <button
                type="button"
                class="h-8.5 px-3 rounded text-xs font-medium bg-surface-card border border-border-default hover:bg-surface-hover text-ink flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                @click="cancelTelegramAppLogin"
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>

        <p class="text-[11px] text-ink-tertiary text-center leading-relaxed mt-2">
          Secure warehouse &amp; stock manager access only. Contact your administrator if you need credentials.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: ['guest'] })
useHead({ title: 'Stock Manager Sign In — Clothing Store' })

const config = useRuntimeConfig()
const authStore = useAuthStore()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const showPassword = ref(false)
const errorMsg = ref('')

const telegramBotId = ref<string>('8453886789')
const appChallengeActive = ref(false)
const appChallengeMessage = ref('')
const appChallengeWebUrl = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null

const features = [
  'Real-time multi-warehouse stock ledger',
  'Inter-warehouse stock transfers & adjustments',
  'Purchase order receiving & supplier management',
  'Product SKU, barcode & QR label printing',
]

async function verifyPortalRolesAndRedirect() {
  const roles = authStore.user?.roles?.map((r: any) => r.name) ?? []
  if (!roles.some((r: string) => ['ADMIN', 'MANAGER', 'WAREHOUSE'].includes(r))) {
    await authStore.logout()
    errorMsg.value = 'This portal is for Warehouse, Manager, and Admin accounts only.'
    return
  }
  await router.push('/dashboard')
}

async function handleLogin() {
  errorMsg.value = ''
  if (!form.username.trim() || !form.password) {
    errorMsg.value = 'Please enter both username/phone and password.'
    return
  }
  loading.value = true
  try {
    await authStore.login(form.username.trim(), form.password)
    await verifyPortalRolesAndRedirect()
  } catch (err: unknown) {
    const error = err as { data?: { detail?: string }; message?: string }
    errorMsg.value = error?.data?.detail || 'Invalid username or password.'
  } finally {
    loading.value = false
  }
}

async function handleTelegramAuthCallback(userPayload: Record<string, unknown>) {
  errorMsg.value = ''
  loading.value = true
  try {
    await authStore.loginWithTelegram(userPayload)
    await verifyPortalRolesAndRedirect()
  } catch (err: unknown) {
    const error = err as { data?: { detail?: string }; message?: string }
    errorMsg.value = error?.data?.detail || 'Telegram authentication failed.'
  } finally {
    loading.value = false
  }
}

function extractTelegramRedirectPayload(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash || ''
  if (hash.includes('tgAuthResult=')) {
    try {
      const encoded = hash.split('tgAuthResult=')[1]?.split('&')[0] || ''
      const normalizedBase64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalizedBase64 + '='.repeat((4 - (normalizedBase64.length % 4)) % 4)
      const parsed = JSON.parse(atob(padded))
      if (parsed && parsed.id && parsed.hash) {
        window.history.replaceState({}, document.title, window.location.pathname)
        return parsed
      }
    } catch {}
  }
  const params = new URLSearchParams(window.location.search)
  if (params.get('id') && params.get('hash') && params.get('auth_date')) {
    const payload: Record<string, unknown> = {
      id: Number(params.get('id')) || params.get('id'),
      auth_date: Number(params.get('auth_date')),
      hash: params.get('hash'),
    }
    if (params.get('first_name')) payload.first_name = params.get('first_name')
    if (params.get('last_name')) payload.last_name = params.get('last_name')
    if (params.get('username')) payload.username = params.get('username')
    if (params.get('photo_url')) payload.photo_url = params.get('photo_url')
    window.history.replaceState({}, document.title, window.location.pathname)
    return payload
  }
  return null
}

function cancelTelegramAppLogin() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  appChallengeActive.value = false
  appChallengeMessage.value = ''
  appChallengeWebUrl.value = ''
}

async function startTelegramAppLogin() {
  if (typeof window === 'undefined') return
  errorMsg.value = ''
  cancelTelegramAppLogin()
  try {
    const ch = await authStore.createTelegramAppChallenge()
    appChallengeActive.value = true
    appChallengeMessage.value = "Tap 'Start' in your Telegram App to sign in..."
    appChallengeWebUrl.value = ch.tg_web_url
    window.location.href = ch.tg_app_url

    pollTimer = setInterval(async () => {
      try {
        const res = await authStore.pollTelegramAppStatus(ch.challenge_token)
        if (res.message) appChallengeMessage.value = res.message
        if (res.status === 'APPROVED') {
          cancelTelegramAppLogin()
          await verifyPortalRolesAndRedirect()
        } else if (res.status === 'REJECTED' || res.status === 'EXPIRED') {
          const msg = res.message || 'Telegram login was declined or expired.'
          cancelTelegramAppLogin()
          errorMsg.value = msg
        }
      } catch (err: any) {
        if (err?.status === 403 || err?.statusCode === 403) {
          cancelTelegramAppLogin()
          errorMsg.value = err?.data?.detail || 'Account is not authorized for this portal.'
        }
      }
    }, 2000)
  } catch (err: any) {
    errorMsg.value = err?.data?.detail || 'Could not start Telegram App login.'
  }
}

onBeforeUnmount(() => {
  cancelTelegramAppLogin()
})

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const redirectedPayload = extractTelegramRedirectPayload()
    if (redirectedPayload) {
      await handleTelegramAuthCallback(redirectedPayload)
      return
    }
  }
  const tgConfig = await authStore.getTelegramConfig()
  if (tgConfig.bot_id) telegramBotId.value = tgConfig.bot_id
})
</script>
