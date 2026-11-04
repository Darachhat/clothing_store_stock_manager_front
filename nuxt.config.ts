// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  devServer: {
    port: 3003,
  },

  experimental: {
    appManifest: false,
    payloadExtraction: false,
    defaults: {
      nuxtLink: {
        prefetch: false,
      },
    },
  },

  hooks: {
    'build:manifest': (manifest) => {
      for (const key in manifest) {
        manifest[key].prefetch = false
      }
    },
  },

  // Nuxt 4 app dir convention
  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],

  tailwindcss: {
    configPath: '~/tailwind.config.ts',
    exposeConfig: false,
  },

  app: {
    head: {
      title: 'Stock & Warehouse Manager — Clothing Store',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Inter:wght@300;400;500;600;700&family=Inter+Tight:wght@400;500;600;700&family=Kantumruy+Pro:wght@400;500;600;700&family=Noto+Sans+Khmer:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    apiBase:     process.env.NUXT_API_BASE     || 'https://api.kimvannak.store',
    // X-System-Authorization value injected server-side; never sent to browser
    apiBaseAuth: process.env.NUXT_API_BASE_AUTH || '',
    public: {
      apiBase:     process.env.NUXT_PUBLIC_API_BASE     || '/api/proxy',
      backendBase: process.env.NUXT_API_BASE            || 'https://api.kimvannak.store',
      appName:     process.env.NUXT_PUBLIC_APP_NAME     || 'Clothing Store — Stock Manager',
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  ui: {
    global: true,
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  css: ['~/assets/css/main.css'],

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  routeRules: {
    // @ts-expect-error: 'proxy' is valid at runtime but not in the RouteRules type definition
    '/uploads/**': { proxy: `${process.env.NUXT_API_BASE || 'https://api.kimvannak.store'}/uploads/**` },
  },
})
