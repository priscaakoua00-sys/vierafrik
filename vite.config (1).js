import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge toutes les variables .env (y compris VITE_*)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // Injecte les variables VITE_* dans globalThis.__VITE_ENV__ au build
    // → accessible dans le code sans import.meta (compatible tous environnements)
    define: {
      'globalThis.__VITE_ENV__': {
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || '',
        VITE_FEDAPAY_PK: env.VITE_FEDAPAY_PK || '',
      },
    },

    build: {
      // Désactive la limite de taille pour le fichier unique SPA
      chunkSizeWarningLimit: 5000,
      rollupOptions: {
        output: {
          // Tout dans un seul bundle (SPA single-file)
          inlineDynamicImports: false,
        },
      },
    },

    // Serveur de dev local
    server: {
      port: 3000,
      open: true,
    },
  };
});
