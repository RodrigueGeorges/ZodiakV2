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
    // ⚠️ esbuild minifier (et pas terser). Terser réécrivait certains
    // class statics + side effect imports d'une manière qui cassait le
    // re-export de `AstrologyService` au runtime
    // (Uncaught SyntaxError: Export 'AstrologyService' is not defined).
    // esbuild est plus rapide ET plus stable sur les modules ES modernes.
    minify: 'esbuild',
    // Pas de sourcemaps en production : -30% de poids déployé.
    // (Activable ponctuellement via `VITE_SOURCEMAP=true` au moment du build.)
    sourcemap: process.env.VITE_SOURCEMAP === 'true',
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: true,
    // Asset inlining : tout ce qui est < 4 KB est en base64 dans le JS
    // (économise des requêtes HTTP sur les petits SVG / icônes).
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Pas de `manualChunks` : Vite/Rollup font un chunk splitting
        // automatique très correct, et on évite les surprises de classes
        // (comme `AstrologyService`) qui sont rapatriées dans un chunk
        // qui ne les ré-exporte pas.
        format: 'es',
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
    // Augmente le seuil de warning : on a quelques chunks lourds
    // (framer-motion, supabase) qui sont attendus.
    chunkSizeWarningLimit: 800,
  },
  esbuild: {
    // Strip console.* et debugger en production (équivalent terser drop_console).
    drop: ['debugger'],
    pure: ['console.log', 'console.debug', 'console.info'],
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