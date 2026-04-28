const { defineConfig } = require('tsup');

module.exports = defineConfig({
  entry: ['src/Barabara.js'],
  format: ['cjs', 'esm'],
  outExtension ({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.mjs' };
  },
  outDir: 'dist',
  clean: true,
  splitting: false,
  dts: false,
  shims: true
});
