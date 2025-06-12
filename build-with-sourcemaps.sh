#!/bin/bash

# Build script with source map generation and upload
echo "🏗️  Building Viking Scouts Event Management with source maps..."

# Create build directory
mkdir -p dist

# Copy HTML and assets
cp src/index.html dist/
cp src/callback.html dist/
cp src/styles.css dist/
cp src/favicon.ico dist/

# Generate source maps for JavaScript modules
echo "📝 Generating source maps..."

# Create source map enabled versions of your JS files
cat src/main.js > dist/main.js
echo "//# sourceMappingURL=main.js.map" >> dist/main.js

cat src/api.js > dist/api.js 
echo "//# sourceMappingURL=api.js.map" >> dist/api.js

cat src/ui.js > dist/ui.js
echo "//# sourceMappingURL=ui.js.map" >> dist/ui.js

cat src/sentry.js > dist/sentry.js
echo "//# sourceMappingURL=sentry.js.map" >> dist/sentry.js

# Generate simple source maps (for demonstration - use proper build tool in production)
echo '{"version":3,"sources":["../src/main.js"],"names":[],"mappings":"AAAA","file":"main.js"}' > dist/main.js.map
echo '{"version":3,"sources":["../src/api.js"],"names":[],"mappings":"AAAA","file":"api.js"}' > dist/api.js.map
echo '{"version":3,"sources":["../src/ui.js"],"names":[],"mappings":"AAAA","file":"ui.js"}' > dist/ui.js.map
echo '{"version":3,"sources":["../src/sentry.js"],"names":[],"mappings":"AAAA","file":"sentry.js"}' > dist/sentry.js.map

# Upload source maps to Sentry
echo "📤 Uploading source maps to Sentry..."
npx sentry-cli releases new "vikings-eventmgmt@$(date +%s)"
npx sentry-cli releases files "vikings-eventmgmt@$(date +%s)" upload-sourcemaps ./dist --url-prefix "~/static/"

echo "✅ Build complete with source maps uploaded to Sentry!"