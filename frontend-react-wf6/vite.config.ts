import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/_wf6/',
  define: { __WF6_REACT_SOURCE__: JSON.stringify(process.env.WF6_REACT_SOURCE_HASH) },
});
