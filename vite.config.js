import { defineConfig } from 'vite'

export default defineConfig({
  // Configuración básica
  root: '.',
  
  // Configuración del servidor de desarrollo
  server: {
    port: 3000,
    host: true, // Permite acceso desde otros dispositivos en la red
    open: true, // Abre automáticamente el navegador
    https: false, // Cambiar a true si necesitas HTTPS local
  },
  
  // Configuración de build
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar las librerías en chunks diferentes
          'html5-qrcode': ['html5-qrcode'],
          'quagga': ['quagga']
        }
      }
    }
  },
  
  // Configuración de preview
  preview: {
    port: 4173,
    host: true,
    open: true
  },
  
  // Optimizaciones
  optimizeDeps: {
    include: ['html5-qrcode', 'quagga']
  },
  
  // Configuración de assets
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  
  // Configuración de CSS
  css: {
    devSourcemap: true
  }
}) 