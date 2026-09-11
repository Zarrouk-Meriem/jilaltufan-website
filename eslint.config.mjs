import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import noPhysicalDirection from './eslint-rules/no-physical-direction.mjs'

export default defineConfig([
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'src/payload-types.ts',
    'src/app/(payload)/admin/importMap.js',
    'playwright-report/**',
    'test-results/**',
    '.artifacts/**',
    '_context/**',
  ]),
  ...nextVitals,
  ...nextTs,
  {
    plugins: { jaa: { rules: { 'no-physical-direction': noPhysicalDirection } } },
    rules: {
      'jaa/no-physical-direction': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['scripts/**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
])
