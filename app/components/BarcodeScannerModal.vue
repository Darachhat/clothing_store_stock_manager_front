<template>
  <AppModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <div class="flex flex-col gap-4 w-full max-w-[540px]">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div class="flex items-center gap-3">
          <div class="w-[38px] h-[38px] rounded-md bg-surface-active border border-border-subtle text-ink flex items-center justify-center">
            <UIcon name="i-heroicons-qr-code" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-[15px] font-semibold text-ink m-0">Barcode Scanner</h3>
            <p class="text-xs text-ink-tertiary m-0">Optical tag scanning for Point of Sale</p>
          </div>
        </div>

        <button type="button" class="p-1 bg-transparent border-none text-ink-tertiary hover:text-ink cursor-pointer transition-colors" @click="closeModal">
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="flex border-b border-border-subtle gap-1 overflow-x-auto">
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 bg-transparent border-none border-b-2 font-medium text-[12.5px] cursor-pointer -mb-px whitespace-nowrap transition-colors"
          :class="activeTab === 'phone' ? 'text-ink border-b-ink' : 'text-ink-secondary border-b-transparent hover:text-ink'"
          @click="activeTab = 'phone'"
        >
          <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4" />
          Connect Phone (Wireless)
          <span v-if="phoneConnected" class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 bg-transparent border-none border-b-2 font-medium text-[12.5px] cursor-pointer -mb-px whitespace-nowrap transition-colors"
          :class="activeTab === 'webcam' ? 'text-ink border-b-ink' : 'text-ink-secondary border-b-transparent hover:text-ink'"
          @click="activeTab = 'webcam'"
        >
          <UIcon name="i-heroicons-video-camera" class="w-4 h-4" />
          PC Webcam
          <span v-if="!hasLocalCamera && isPC" class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-border-subtle">None</span>
        </button>
      </div>

      <!-- Tab 1: Phone Wireless Pairing -->
      <div v-if="activeTab === 'phone'" class="flex flex-col gap-3.5">
        <!-- PC Camera Missing Banner (if applicable) -->
        <div v-if="isPC && !hasLocalCamera" class="flex items-start gap-2.5 p-2.5 sm:px-3 rounded-md text-xs leading-snug bg-surface-hover border border-border-subtle text-ink">
          <UIcon name="i-heroicons-information-circle" class="w-5 h-5 flex-shrink-0 text-ink-secondary" />
          <div>
            <strong>No camera detected on this PC.</strong>
            Please connect your mobile phone as a wireless barcode scanner by scanning the QR code below.
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 items-start">
          <!-- QR Code Box -->
          <div class="flex flex-col items-center gap-2">
            <div class="w-[170px] h-[170px] bg-white border border-border-subtle rounded-lg p-1.5 flex items-center justify-center">
              <img
                v-if="qrCodeUrl"
                :src="qrCodeUrl"
                alt="Scanner pairing QR Code"
                class="w-full h-full object-contain"
              />
              <div v-else class="text-xs text-ink-tertiary">Generating QR...</div>
            </div>

            <div class="flex items-center gap-1.5 text-[11px] text-ink-tertiary" :class="{ '!text-emerald-500': phoneConnected }">
              <span class="w-2 h-2 rounded-full bg-current" />
              <span>{{ phoneConnected ? 'Phone Connected & Active' : 'Waiting for phone connection...' }}</span>
            </div>
          </div>

          <!-- Pairing Instructions -->
          <div class="flex flex-col gap-3">
            <div class="flex gap-2.5 items-start text-xs">
              <span class="w-5 h-5 rounded-full bg-surface-active text-ink font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
              <div>
                <strong class="text-ink block">Scan QR Code with your phone</strong>
                <p class="text-ink-tertiary mt-0.5 mb-0">Open camera app on your phone and tap the link</p>
              </div>
            </div>

            <div class="flex gap-2.5 items-start text-xs">
              <span class="w-5 h-5 rounded-full bg-surface-active text-ink font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
              <div>
                <strong class="text-ink block">Point phone camera at tag</strong>
                <p class="text-ink-tertiary mt-0.5 mb-0">Barcodes are transmitted directly to this POS screen in real time</p>
              </div>
            </div>

            <!-- LAN IP / Host config for testing -->
            <div class="bg-surface-card border border-border-subtle rounded-md p-2 sm:px-2.5 flex flex-col gap-1">
              <label class="text-[11px] text-ink-tertiary">Companion Link:</label>
              <div class="flex gap-1.5">
                <input
                  v-model="customHost"
                  type="text"
                  placeholder="e.g. 192.168.1.10:3000"
                  class="flex-1 text-xs border border-border-subtle rounded px-2 py-1 bg-surface-hover text-ink focus:outline-hidden font-mono"
                  @change="updateHost"
                />
                <AppButton size="sm" variant="secondary" :label="copied ? 'Copied!' : 'Copy'" @click="copyPairingUrl" />
              </div>
              <span class="text-ink-tertiary font-mono text-xs">PIN: {{ sessionShortCode }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: PC Webcam -->
      <div v-else-if="activeTab === 'webcam'" class="flex flex-col gap-3.5">
        <div v-if="!hasLocalCamera" class="flex flex-col items-center justify-center text-center p-7 bg-surface-card border border-dashed border-border-subtle rounded-lg gap-2 text-ink-secondary">
          <UIcon name="i-heroicons-video-camera-slash" class="w-10 h-10 text-slate-400" />
          <div class="font-semibold text-sm text-ink">No Webcam Found on this PC</div>
          <p class="text-xs text-ink-tertiary max-w-[340px]">Connect a USB webcam, or switch to the "Connect Phone" tab to use your smartphone camera.</p>
          <AppButton variant="primary" size="sm" label="Switch to Phone Scanner" @click="activeTab = 'phone'" />
        </div>

        <div v-else class="relative w-full h-[220px] bg-black rounded-lg overflow-hidden border border-border-subtle">
          <video ref="webcamVideoRef" autoplay playsinline muted class="w-full h-full object-cover" />
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-[min(220px,75%)] h-[120px] border-2 border-dashed border-white/70 rounded-lg" />
          </div>
        </div>
      </div>

      <!-- Recent Scans / Live Log -->
      <div class="bg-surface-card border border-border-subtle rounded-md p-2.5 sm:px-3 flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Live Scanned Items ({{ recentScans.length }})</span>
          <button v-if="recentScans.length" type="button" class="text-[11px] text-ink-tertiary bg-transparent border-none cursor-pointer hover:text-ink" @click="recentScans = []">
            Clear
          </button>
        </div>

        <div v-if="recentScans.length === 0" class="text-xs text-ink-tertiary italic py-1">
          No items scanned yet. Scan a garment barcode or SKU to add directly to cart.
        </div>

        <div v-else class="flex flex-col gap-1">
          <div
            v-for="(scan, idx) in recentScans"
            :key="idx"
            class="flex items-center justify-between px-2 py-1.5 bg-surface-hover rounded border border-border-subtle"
          >
            <div class="text-[12.5px] font-semibold text-ink font-mono">{{ scan.barcode }}</div>
            <div class="flex items-center gap-2 text-[11px] text-ink-tertiary">
              <span class="bg-surface-active px-1.5 py-0.5 rounded text-[10px] border border-border-subtle">{{ scan.source || 'Phone' }}</span>
              <span class="text-xs text-ink-tertiary">{{ formatTime(scan.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end border-t border-border-subtle pt-3">
        <AppButton variant="secondary" size="sm" label="Done" @click="closeModal" />
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean
  }>(),
  {
    modelValue: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'scanned', barcode: string): void
}>()

const config = useRuntimeConfig()
const apiBase = config.public.apiBase || '/api/proxy'
const backendBase = (config.public.backendBase as string) || (apiBase.startsWith('http') ? apiBase : 'http://localhost:8000')

const isPC = ref(true)
const hasLocalCamera = ref(false)
const activeTab = ref<'phone' | 'webcam'>('phone')
const phoneConnected = ref(false)
const copied = ref(false)

const sessionId = ref('')
const sessionShortCode = ref('')
const customHost = ref('')
const qrCodeUrl = ref('')
const recentScans = ref<any[]>([])

const webcamVideoRef = ref<HTMLVideoElement | null>(null)
let webcamStream: MediaStream | null = null
let ws: WebSocket | null = null
let pollInterval: any = null
let lastHandledBarcode = ''
let lastHandledTime = 0

// Sound synthesizer for crisp cashier chime
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1) // A6
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch {
    // blocked
  }
}

// Generate new session token
function initSession() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  sessionId.value = `sess_${rand}`
  sessionShortCode.value = rand

  if (typeof window !== 'undefined') {
    customHost.value = window.location.host
  }
  updateQrUrl()
}

// Companion pairing URL
const pairingUrl = computed(() => {
  const host = customHost.value.trim() || (typeof window !== 'undefined' ? window.location.host : 'localhost:3000')
  const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:'
  return `${proto}//${host}/scanner?session=${sessionId.value}`
})

function updateQrUrl() {
  qrCodeUrl.value = `${backendBase}/api/v1/scanner/qr?text=${encodeURIComponent(pairingUrl.value)}`
}

function updateHost() {
  updateQrUrl()
}

async function copyPairingUrl() {
  try {
    await navigator.clipboard.writeText(pairingUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    //
  }
}

// Handle incoming scan
function onBarcodeReceived(barcode: string, source = 'Phone Camera') {
  if (!barcode) return
  const now = Date.now()
  if (barcode === lastHandledBarcode && now - lastHandledTime < 1500) {
    return
  }
  lastHandledBarcode = barcode
  lastHandledTime = now

  playChime()
  recentScans.value.unshift({
    barcode,
    source,
    timestamp: now,
  })

  // Emit to parent POS
  emit('scanned', barcode)
}

// WebSocket connection to backend
function connectWebSocket() {
  if (!sessionId.value) return
  const wsProto = backendBase.startsWith('https') ? 'wss' : 'ws'
  const wsHost = backendBase.replace(/^https?:\/\//, '')
  const wsUrl = `${wsProto}://${wsHost}/api/v1/scanner/ws/${sessionId.value}?client_type=pc`

  try {
    ws = new WebSocket(wsUrl)
    ws.onmessage = (event) => {
      try {
        const data = jsonParse(event.data)
        if (data.type === 'peer_connected' && data.client_type === 'phone') {
          phoneConnected.value = true
        } else if (data.type === 'peer_disconnected' && data.client_type === 'phone') {
          phoneConnected.value = false
        } else if (data.type === 'barcode_scanned') {
          onBarcodeReceived(data.barcode, 'Phone Camera')
        }
      } catch {
        //
      }
    }
    ws.onclose = () => {
      // Reconnect in 3s if modal still open
      if (props.modelValue) {
        setTimeout(connectWebSocket, 3000)
      }
    }
  } catch {
    //
  }
}

function jsonParse(str: string) {
  try { return JSON.parse(str) } catch { return {} }
}

// Poll fallback for reliable status & scans
async function pollSession() {
  if (!sessionId.value || !props.modelValue) return
  try {
    const res = await fetch(`${backendBase}/api/v1/scanner/${sessionId.value}/status`)
    if (res.ok) {
      const data = await res.json()
      if (data.phone_connected) {
        phoneConnected.value = true
      }
      if (data.last_barcode && data.last_barcode !== lastHandledBarcode) {
        onBarcodeReceived(data.last_barcode, 'Phone (HTTP)')
      }
    }
  } catch {
    //
  }
}

// Detect hardware
async function checkDeviceAndCameras() {
  if (typeof navigator === 'undefined') return
  isPC.value = !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

  try {
    if (navigator.mediaDevices?.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(d => d.kind === 'videoinput')
      hasLocalCamera.value = videoInputs.length > 0
    } else {
      hasLocalCamera.value = false
    }
  } catch {
    hasLocalCamera.value = false
  }

  // If on PC without camera, force phone tab
  if (isPC.value && !hasLocalCamera.value) {
    activeTab.value = 'phone'
  }
}

// PC Webcam stream
async function startWebcam() {
  if (!hasLocalCamera.value) return
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    })
    if (webcamVideoRef.value) {
      webcamVideoRef.value.srcObject = webcamStream
    }
  } catch {
    //
  }
}

function stopWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop())
    webcamStream = null
  }
}

function closeModal() {
  emit('update:modelValue', false)
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    initSession()
    checkDeviceAndCameras()
    connectWebSocket()
    pollInterval = setInterval(pollSession, 2000)
    if (activeTab.value === 'webcam') {
      startWebcam()
    }
  } else {
    if (ws) {
      ws.close()
      ws = null
    }
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    stopWebcam()
  }
})

watch(activeTab, (tab) => {
  if (tab === 'webcam') {
    startWebcam()
  } else {
    stopWebcam()
  }
})

onMounted(() => {
  checkDeviceAndCameras()
})

onUnmounted(() => {
  if (ws) ws.close()
  if (pollInterval) clearInterval(pollInterval)
  stopWebcam()
})
</script>
