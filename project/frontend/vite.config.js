import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Si no hay VITE_API_URL, el front usa /api y Vite lo redirige al backend local
    proxy: { '/api': 'http://localhost:3001' },
  },
});
