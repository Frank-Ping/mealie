import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['node_modules/**','dist-samples/**','dist-components/**','src/reused/**'] },
  ...tseslint.configs.recommended,
  { files: ['src/**/*.{ts,tsx}','tests/**/*.{ts,tsx}'], plugins: { 'react-hooks': hooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      // Unused generated imports are removed by rule refinement, not suppressed globally.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    } },
);
