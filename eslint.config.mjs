// eslint.config.mjs
// This file configures ESLint, a static analysis tool for identifying and reporting
// on patterns found in ECMAScript/JavaScript code. It helps maintain code quality,
// consistency, and catch potential errors early.
// This configuration uses the new "flat" configuration format.

import js from "@eslint/js"; // ESLint's official JavaScript plugin and recommended rules.
import globals from "globals"; // Provides global variable definitions (e.g., browser, node).
import markdown from "@eslint/markdown"; // Plugin for linting JavaScript code blocks within Markdown files.
import { defineConfig } from "eslint/config"; // Helper function for defining ESLint configurations with type checking.

// `defineConfig` is used here for better type safety and autocompletion when editing the config.
export default defineConfig([
  // Configuration object for JavaScript files (js, mjs, cjs).
  {
    files: ["**/*.{js,mjs,cjs}"], // Specifies which files this configuration applies to.
    plugins: { js }, // Enables the ESLint JavaScript plugin.
    extends: ["js/recommended"] // Uses ESLint's recommended set of rules for JavaScript.
  },
  // Configuration object to define global variables for JavaScript files.
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.browser, // Includes all standard browser global variables.
        ...globals.node,    // Includes Node.js globals like process, __dirname, etc.
        // You can add other global environments like jest, etc., or custom globals here.
      }
    }
  },
  // Configuration object for Markdown files.
  {
    files: ["**/*.md"], // Applies to all Markdown files.
    plugins: { markdown }, // Enables the ESLint Markdown plugin.
    language: "markdown/gfm", // Specifies the language processor for GitHub Flavored Markdown.
    extends: ["markdown/recommended"] // Uses recommended rules for Markdown.
  },
  // Configuration for rule overrides
  {
    files: ["**/*.{js,mjs,cjs}"],
    rules: {
      "no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",    // Ignore args starting with _
        "varsIgnorePattern": "^_",    // Ignore variables starting with _
        "destructuredArrayIgnorePattern": "^_" // Ignore destructured vars starting with _
      }]
    }
  }
]);
