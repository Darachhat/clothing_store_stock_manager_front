<template>
  <div class="login-root">
    <!-- Left panel: branding -->
    <div class="login-brand">
      <div class="login-brand__inner">
        <div class="login-brand__logo">
          <UIcon name="i-heroicons-cube" class="w-6 h-6 text-white" />
        </div>
        <div class="login-brand__name">{{ config.public.appName }}</div>
        <p class="login-brand__tagline">Stock &amp; Warehouse Manager portal. Full access to inventory levels, transfers, purchase receiving, and barcode/QR labels.</p>
        <div class="login-brand__features">
          <div v-for="feat in features" :key="feat" class="login-brand__feature">
            <UIcon name="i-heroicons-check" class="w-3.5 h-3.5 text-white stroke-[2.5]" />
            {{ feat }}
          </div>
        </div>
      </div>
    </div>

    <!-- Right panel: form -->
    <div class="login-form-panel">
      <div class="login-form-wrap">
        <div class="login-form-header">
          <h1 class="login-form-title">Stock Manager Sign In</h1>
          <p class="login-form-subtitle">Enter your warehouse, manager, or admin credentials.</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="login-field">
            <label class="login-label" for="username">Username or Verified Phone</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="login-input"
              placeholder="warehouse or +85569382165"
              autocomplete="username"
              autofocus
              required
            />
          </div>

          <div class="login-field">
            <label class="login-label" for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="login-input"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="login-pw-toggle"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <UIcon v-if="!showPassword" name="i-heroicons-eye" class="w-4 h-4" />
              <UIcon v-else name="i-heroicons-eye-slash" class="w-4 h-4" />
            </button>
          </div>

          <div v-if="errorMsg" class="login-error">
            <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 flex-shrink-0" />
            {{ errorMsg }}
          </div>

          <button type="submit" class="login-btn" :disabled="loading">
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="login-btn__spinner w-4 h-4 text-white" />
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <div class="login-divider">
          <span>or</span>
        </div>

        <div class="telegram-login-section">
          <div ref="telegramWidgetContainer" class="telegram-widget-box" />
          <button
            type="button"
            class="login-tg-btn"
            :disabled="loading"
            @click="showTelegramModal = !showTelegramModal"
          >
            <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4" />
            <span>Sign in with Telegram</span>
          </button>

          <div v-if="showTelegramModal" class="telegram-payload-card">
            <p class="telegram-payload-hint">
              Paste a signed Telegram Login verification payload (verified with HMAC-SHA256 on backend):
            </p>
            <textarea
              v-model="telegramPayloadJson"
              rows="3"
              class="telegram-payload-textarea"
              placeholder='{"id": 123456789, "first_name": "Warehouse", "username": "stock_tg", "auth_date": 1730000000, "hash": "..."}'
            />
            <button
              type="button"
              class="login-btn"
              :disabled="loading || !telegramPayloadJson.trim()"
              @click="handleTelegramJsonLogin"
            >
              <UIcon name="i-heroicons-check-badge" class="w-4 h-4" />
              <span>Verify &amp; Sign In</span>
            </button>
          </div>
        </div>

        <p class="login-footer-note">
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

const telegramWidgetContainer = ref<HTMLElement | null>(null)
const showTelegramModal = ref(false)
const telegramPayloadJson = ref('')

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

async function handleTelegramJsonLogin() {
  errorMsg.value = ''
  try {
    const parsed = JSON.parse(telegramPayloadJson.value)
    await handleTelegramAuthCallback(parsed)
  } catch {
    errorMsg.value = 'Invalid Telegram authentication JSON format.'
  }
}

onMounted(async () => {
  if (typeof window !== 'undefined') {
    ;(window as any).onTelegramAuthStock = (user: Record<string, unknown>) => {
      handleTelegramAuthCallback(user)
    }
  }
  const tgConfig = await authStore.getTelegramConfig()
  if (tgConfig.enabled && tgConfig.bot_username && telegramWidgetContainer.value) {
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', tgConfig.bot_username)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuthStock(user)')
    script.setAttribute('data-request-access', 'write')
    telegramWidgetContainer.value.appendChild(script)
  }
})
</script>

<style scoped>
.login-root {
  display: flex;
  min-height: 100dvh;
  background: var(--surface-bg);
}

.login-brand {
  display: none;
  width: 400px;
  min-width: 400px;
  background: var(--brand-900);
  padding: var(--space-6) var(--space-4);
  flex-direction: column;
  justify-content: center;
}

@media (min-width: 768px) {
  .login-brand { display: flex; }
}

.login-brand__inner { display: flex; flex-direction: column; gap: var(--space-3); }
.login-brand__logo { width: 48px; height: 48px; background: rgba(255,255,255,0.1); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; }
.login-brand__name { font-size: 22px; font-weight: 700; color: white; letter-spacing: -0.02em; margin-top: 4px; }
.login-brand__tagline { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; max-width: 52ch; }
.login-brand__features { display: flex; flex-direction: column; gap: 10px; margin-top: var(--space-1); }
.login-brand__feature { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.75); }

.login-form-panel { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--space-4) var(--space-2); }
.login-form-wrap { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: var(--space-3); }
.login-form-header { display: flex; flex-direction: column; gap: 4px; }
.login-form-title { font-size: 22px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; }
.login-form-subtitle { font-size: 13px; color: var(--text-secondary); }

.login-form { display: flex; flex-direction: column; gap: var(--space-2); }
.login-field { display: flex; flex-direction: column; gap: 6px; position: relative; }
.login-label { font-size: 12px; font-weight: 600; color: var(--text-primary); letter-spacing: 0.01em; max-width: none; }
.login-input { height: 40px; width: 100%; border: 1px solid var(--border-subtle, #e5e7eb); border-radius: var(--radius-md); padding: 0 12px; font-family: var(--font-body); font-size: 14px; color: var(--text-primary); background: var(--surface-card); outline: none; }
.login-input:focus { border-color: var(--border-subtle, #e2e8f0); }
.login-input::placeholder { color: var(--text-tertiary); }
.login-pw-toggle { position: absolute; right: 10px; bottom: 10px; color: var(--text-tertiary); background: none; border: none; cursor: pointer; padding: 0; display: flex; }
.login-pw-toggle:hover { color: var(--text-primary); }

.login-error { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: var(--status-red-bg); border-radius: var(--radius-md); font-size: 13px; color: var(--status-red); }

.login-btn { height: 40px; width: 100%; background: var(--accent); color: var(--accent-fg); border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px; }
.login-btn:hover:not(:disabled) { opacity: 0.88; }
.login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.login-btn__spinner { animation: spin 0.8s linear infinite; }

.login-divider { display: flex; align-items: center; gap: 10px; font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; }
.login-divider::before, .login-divider::after { content: ''; flex: 1; height: 1px; background: var(--border-subtle, #e5e7eb); }

.telegram-login-section { display: flex; flex-direction: column; gap: 8px; }
.telegram-widget-box { display: flex; justify-content: center; }
.login-tg-btn { height: 38px; width: 100%; background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-subtle, #e5e7eb); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.login-tg-btn:hover:not(:disabled) { background: var(--surface-subtle, #f8fafc); }

.telegram-payload-card { padding: 10px; border: 1px solid var(--border-subtle, #e5e7eb); border-radius: var(--radius-md); background: var(--surface-card); display: flex; flex-direction: column; gap: 8px; }
.telegram-payload-hint { font-size: 11px; color: var(--text-secondary); line-height: 1.4; }
.telegram-payload-textarea { width: 100%; border: 1px solid var(--border-subtle, #e5e7eb); border-radius: var(--radius-md); padding: 8px; font-family: var(--font-mono, monospace); font-size: 11px; color: var(--text-primary); background: var(--surface-bg); outline: none; resize: vertical; }

@keyframes spin { to { transform: rotate(360deg); } }
.login-footer-note { font-size: 12px; color: var(--text-tertiary); text-align: center; max-width: none; }
</style>
