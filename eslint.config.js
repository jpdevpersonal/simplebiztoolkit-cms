import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    'dist',
    '.next',
    'out',
    'build',
    'next-env.d.ts',
    '.next/types/**',
    'src/spa_app',
    'src/spa_pages',
    'src/test',
    '**/*.test.ts',
    '**/*.test.tsx',
  ]),
])
