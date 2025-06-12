#!/bin/bash

# Add inline source maps to existing files (no build step needed)
echo "📝 Adding inline source maps to source files..."

# Function to add inline source map to a JS file
add_inline_sourcemap() {
    local file=$1
    local filename=$(basename "$file")
    
    # Remove existing source map comment if present
    sed -i.bak '/sourceMappingURL/d' "$file" && rm -f "$file.bak"
    
    # Read file content and escape it properly for JSON
    local content=$(cat "$file" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
    
    # Create a proper source map with actual content
    local sourcemap="{\"version\":3,\"sources\":[\"$filename\"],\"names\":[],\"mappings\":\"AAAA\",\"file\":\"$filename\",\"sourcesContent\":[\"$content\"]}"
    
    # Add the inline source map
    echo "" >> "$file"
    echo "//# sourceMappingURL=data:application/json;charset=utf-8;base64,$(echo "$sourcemap" | base64 | tr -d '\n')" >> "$file"
    echo "✅ Added inline source map to $filename"
}

# Add to main source files
add_inline_sourcemap "src/main.js"
add_inline_sourcemap "src/api.js" 
add_inline_sourcemap "src/ui.js"
add_inline_sourcemap "src/sentry.js"

echo "✅ Inline source maps added - no build step required!"
echo "🔄 Run this script again whenever you make significant changes to get updated source maps."