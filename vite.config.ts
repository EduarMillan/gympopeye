import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Popeye Gym',
        short_name: 'Popeye Gym',
        description:
          'Gestión del gimnasio: socios, pagos, asistencia y contabilidad.',
        theme_color: '#dc2626',
        background_color: '#0f0f10',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'es',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precachea todo el bundle para que la app cargue 100% offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // El logo original (1.5 MB) no se usa en runtime; los íconos
        // generados lo cubren. Lo excluimos para aligerar la instalación.
        globIgnores: ['**/logo.png'],
      },
    }),
  ],
})
