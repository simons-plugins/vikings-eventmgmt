#!/bin/bash

# add-inline-sourcemaps.sh
# This script generates and adds basic inline source maps to specified JavaScript files.
# An inline source map embeds the source map data directly into the JavaScript file
# as a base64 encoded data URL. This is useful for debugging in environments where
# separate .map files might not be easily served or accessed, or for simplifying
# deployment when complex build steps are not desired for source map generation.
# Note: This script creates a very simple source map that primarily includes the original
# source content. It does not generate detailed mappings between compiled and original code
# like a full build tool (e.g., Webpack, Babel with source map options) would.

echo "📝 Adding inline source maps to source files..."

# Function to add an inline source map to a given JavaScript file.
# Parameter $1: Path to the JavaScript file.
add_inline_sourcemap() {
    local file=$1 # Assign the first argument (file path) to a local variable.
    local filename=$(basename "$file") # Extract the filename from the path.
    
    # Remove any existing sourceMappingURL comment from the file.
    # -i.bak creates a backup before editing; && rm -f "$file.bak" removes the backup if sed succeeds.
    sed -i.bak '/sourceMappingURL/d' "$file" && rm -f "$file.bak"
    
    # Read the content of the JavaScript file.
    # Escape backslashes, double quotes, and newlines to ensure it's a valid JSON string
    # when embedded within the "sourcesContent" field of the source map.
    # sed 's/\\/\\\\/g': Escapes backslashes.
    # sed 's/"/\\"/g': Escapes double quotes.
    # sed ':a;N;$!ba;s/\n/\\n/g': Replaces newline characters with \n.
    local content=$(cat "$file" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
    
    # Create a basic source map JSON structure.
    # "version":3 - Source map version.
    # "sources": An array of original source file names. Here, just the input filename.
    # "names": Array of identifiers used in the code (empty for this basic map).
    # "mappings":"AAAA" - A minimal valid mapping (points to the first line, first column of the source).
    #                     This script does not generate detailed mappings.
    # "file": The name of the generated file (the JS file itself).
    # "sourcesContent": An array of strings containing the original source code.
    local sourcemap="{\"version\":3,\"sources\":[\"$filename\"],\"names\":[],\"mappings\":\"AAAA\",\"file\":\"$filename\",\"sourcesContent\":[\"$content\"]}"
    
    # Append the sourceMappingURL comment to the JavaScript file.
    # The source map JSON is base64 encoded and embedded in a data URL.
    # `tr -d '\n'` removes newlines from the base64 output, as some tools might have issues with it.
    echo "" >> "$file" # Add a newline for separation.
    echo "//# sourceMappingURL=data:application/json;charset=utf-8;base64,$(echo "$sourcemap" | base64 | tr -d '\n')" >> "$file"
    echo "✅ Added inline source map to $filename"
}

# Process specific JavaScript files by calling the function.
# This section can be modified to include different or more files,
# or use a loop with `find` to process multiple files in a directory.
echo "ℹ️  Processing main application files..."
add_inline_sourcemap "src/main.js"
add_inline_sourcemap "src/lib/api.js"       # Corrected path if api.js is in lib
add_inline_sourcemap "src/ui.js"
add_inline_sourcemap "src/sentry.js"
# Example for processing all JS files in src/lib:
# find src/lib -name "*.js" -print0 | while IFS= read -r -d $'\0' file; do
#   add_inline_sourcemap "$file"
# done

echo "🎉 Inline source maps added successfully."
echo "🔄 Run this script again if you make significant changes to the source files to update the embedded source maps."