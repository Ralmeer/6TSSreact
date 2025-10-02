import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {\n    port: 5174,\n    proxy: {\n      \'/api/auth\': {\n        target: \'https://my-backend-worker.jeanmichelwilliams3.workers.dev\',\n        changeOrigin: true,\n        rewrite: (path) => path.replace(/^\/api\/auth/, \'/api/auth\'),\n      },\n    },\n  },\n})
