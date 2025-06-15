import esbuild from 'esbuild';
import vue3Plugin from 'esbuild-plugin-vue3';

// Configuration object (similar to what was in esbuild.config.js)
const config = {
  entryPoints: ['src/vue-entry.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  plugins: [vue3Plugin()],
  // loader: {
  //   // If you need JSX in .js files (not SFCs .vue files), keep this.
  //   // Otherwise, if you only use <script setup> or standard JS in .vue files,
  //   // and your .js files are standard JS, you might not need this loader for .js.
  //   // '.js': 'jsx'
  // },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  sourcemap: true, // Generate source maps for easier debugging
  logLevel: 'info', // Get more detailed output from esbuild
};

async function build() {
  try {
    await esbuild.build(config);
    console.log('Vue build completed successfully!');
  } catch (error) {
    console.error('Vue build failed:', error);
    process.exit(1);
  }
}

build();
