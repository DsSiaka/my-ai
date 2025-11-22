import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['remark-math']
  },
  // Si tu as déjà d'autres options build, laisse-les ici.
});
