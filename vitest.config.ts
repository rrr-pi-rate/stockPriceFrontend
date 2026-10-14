import { defineConfig } from 'vitest/config';

// Ionic 9 ships ESM with extensionless relative imports, which Node's resolver rejects when
// vitest externalizes the packages. Kirby imports Ionic, so both are inlined for vite to resolve.
export default defineConfig({
  test: {
    server: { deps: { inline: [/@ionic\//, /@kirbydesign\//] } },
  },
});
