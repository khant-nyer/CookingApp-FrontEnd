import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'node_modules']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: [
              '../features/backend-explorer/*/*',
              '../features/backend-explorer/*/*/*',
              '../../features/backend-explorer/*/*',
              '../../features/backend-explorer/*/*/*'
            ],
            message: 'Avoid deep imports across feature boundaries; import through feature entry points.'
          },
          {
            group: ['**/styles.css'],
            message: 'Use split style entry points (`src/styles/base.css` or feature-scoped style files).'
          }
        ]
      }]
    }
  },
  {
    files: ['src/components/BackendExplorer.tsx', 'src/context/useAuth.ts'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'no-restricted-imports': 'off'
    }
  }
);
