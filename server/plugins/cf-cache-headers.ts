/**
 * Nitro Server Plugin: Cloudflare Anti-Stale-HTML Headers & Auto-Purge
 */
let purgeTriggered = false

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    setResponseHeader(event, 'cache-control', 'no-cache, no-store, must-revalidate')
    setResponseHeader(event, 'cdn-cache-control', 'no-store')
    setResponseHeader(event, 'cloudflare-cdn-cache-control', 'no-store')
    setResponseHeader(event, 'pragma', 'no-cache')

    if (Array.isArray(html.head)) {
      html.head = html.head.map((chunk) =>
        typeof chunk === 'string'
          ? chunk.replace(/<link[^>]*\brel=["']prefetch["'][^>]*>/gi, '')
          : chunk
      )
    }

    if (!purgeTriggered) {
      purgeTriggered = true
      const env = (event.context?.cloudflare?.env || process.env || {}) as Record<string, string | undefined>
      const zoneId = (env.CF_ZONE_ID || env.CLOUDFLARE_ZONE_ID || '').trim()
      const apiToken = (env.CF_API_TOKEN || env.CLOUDFLARE_API_TOKEN || env.CF_PURGE_TOKEN || '').trim()

      if (zoneId && apiToken) {
        const p = fetch(`https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zoneId)}/purge_cache`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ purge_everything: true }),
        }).catch(() => {})

        if (event.context?.cloudflare?.context?.waitUntil) {
          event.context.cloudflare.context.waitUntil(p)
        }
      }
    }
  })
})
