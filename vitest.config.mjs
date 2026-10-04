import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname) } },
  test: {
    include: ['**/*.test.{js,ts}'],
    exclude: ['node_modules/**', '.next/**', 'out/**', 'dist/**'],
    environment: 'node',
  },
})
