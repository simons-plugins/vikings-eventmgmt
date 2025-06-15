// webpack.config.js
module.exports = {
  mode: 'development', // or 'production'
  devtool: 'source-map', // Generates external .map files
  // or 'inline-source-map' for inline maps
  
  entry: './src/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  
  // ...existing config
};