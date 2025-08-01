import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion': ['framer-motion'],
          'icons': ['lucide-react'],
          'utils': ['luxon', 'clsx', 'tailwind-merge']
        },
        format: 'es',
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['lucide-react', 'react', 'react-dom', 'react-router-dom', 'framer-motion']
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      port: 5173
    },
    proxy: {
      '/api': {
        target: 'http://localhost:9999/.netlify/functions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      }
    }
  },
  define: {
    'process.env': {},
  },
  preview: {
    port: 4173,
    host: true,
  },
  // Ajout de la configuration pour les variables d'environnement
  envPrefix: 'VITE_'
});