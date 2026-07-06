/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Use jsdom to simulate a browser for React component tests
    environment: 'jsdom',
    // Load @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
    setupFiles: ['./src/test-setup.ts'],
    // Make describe/it/expect available without importing in every file
    globals: true,
  },
})
