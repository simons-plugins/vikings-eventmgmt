// build.js - Simple ESBuild script
import esbuild from 'esbuild';

const isDev = process.argv.includes('--dev');

await esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: false, // Keep ES modules separate
  sourcemap: true,
  outdir: 'dist',
  format: 'esm',
  target: 'es2022',
  
  // For development
  ...(isDev && {
    sourcemap: 'inline',
    watch: true
  })
});

console.log('✅ Build complete with source maps');