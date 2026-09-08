/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Vitest's default exclude list contains "**/dist/**", which would also match our
    // tests/dist/ directory. Override it with the same defaults minus that entry so
    // tests/dist/*.test.ts is collected while the built dist/ output is still ignored
    // (it's outside tests/**, so it was never matched by `include` anyway).
    exclude: [
      '**/node_modules/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
    ],
  },
});
