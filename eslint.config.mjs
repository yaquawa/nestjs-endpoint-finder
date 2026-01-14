/**
 * ESLint v9 Flat Config - 2025年スタンダード設定
 * TypeScript + React + VSCode拡張対応
 */

import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import unicorn from 'eslint-plugin-unicorn'
import security from 'eslint-plugin-security'
import unusedImports from 'eslint-plugin-unused-imports'
import prettier from 'eslint-config-prettier'

export default [
  // 除外設定
  {
    ignores: [
      'node_modules/**',
      'out/**',
      'dist/**',
      '.vscode-test/**',
      '.vscode/**',
      '.idea/**',
      'resources/**',
      '*.d.ts',
      '*.json',
      '*.md',
      '*.svg',
      '*.css',
      '*.html',
      '.prettierrc.json',
      '.prettierignore',
      '.gitignore',
      'package-lock.json',
      'src/webview/index.html',
      'src/webview/styles.css',
      '**/.DS_Store',
    ],
  },

  // JavaScript基本設定
  js.configs.recommended,

  // TypeScript設定（全TSファイル）
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      unicorn: unicorn,
      security: security,
      'unused-imports': unusedImports,
    },
    rules: {
      // TypeScript推奨ルール
      ...typescript.configs.recommended.rules,

      // TypeScript 2025年ベストプラクティス
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off', // unused-importsで代替
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // モダンJavaScript（Unicorn）
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-ternary': 'error',
      'unicorn/prefer-logical-operator-over-ternary': 'error',
      'unicorn/no-array-for-each': 'warn',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/better-regex': 'error',

      // セキュリティ
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-unsafe-regex': 'error',

      // 一般的なベストプラクティス
      'no-console': 'off', // VSCode拡張ではデバッグに必要
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },

  // React WebView専用設定
  {
    files: ['src/webview/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // ブラウザ環境
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        acquireVsCodeApi: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLButtonElement: 'readonly',
        MessageEvent: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    plugins: {
      react: react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: '19.0',
      },
    },
    rules: {
      // React基本ルール
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // React 19対応
      'react/react-in-jsx-scope': 'off', // React 17+で不要
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/jsx-no-bind': 'warn',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/prop-types': 'off', // TypeScriptで型チェック

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // WebView環境特有
      'unicorn/prefer-module': 'off', // ブラウザ環境
    },
  },

  // VSCode拡張本体設定（Node.js環境）
  {
    files: ['src/**/*.ts', '!src/webview/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Node.js環境
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        NodeJS: 'readonly',
        Thenable: 'readonly',
      },
    },
    rules: {
      // Node.js環境用調整
      'unicorn/prefer-module': 'off', // CommonJS許可
      '@typescript-eslint/no-var-requires': 'off', // require()許可
      'unicorn/prefer-node-protocol': 'off', // VSCode APIとの兼ね合い

      // VSCode拡張開発
      'no-console': 'off', // デバッグログ許可
    },
  },

  // 設定ファイル用
  {
    files: ['*.config.{js,ts}', 'scripts/**/*.js'],
    languageOptions: {
      globals: {
        // Node.js環境
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        NodeJS: 'readonly',
        Thenable: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'unicorn/prefer-module': 'off',
      'no-console': 'off',
    },
  },

  // Prettier統合（最後に配置）
  prettier,
]
