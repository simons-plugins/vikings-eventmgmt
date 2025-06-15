// tailwind.config.js
// This file is used to configure Tailwind CSS.
// Tailwind CSS is a utility-first CSS framework that provides low-level utility classes
// to build custom designs directly in your markup. This configuration file allows you to:
// - Customize the default theme (colors, fonts, spacing, breakpoints, etc.).
// - Add custom utility classes.
// - Register Tailwind CSS plugins.
// - Specify the content sources for Tailwind to scan for class names.

/** @type {import('tailwindcss').Config} */
module.exports = {
  // The `content` array specifies the files Tailwind should scan to find utility classes
  // that are being used in your project. This is crucial for tree-shaking unused styles
  // in production builds, resulting in smaller CSS file sizes.
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}", // Include HTML, JS, JSX, TS, TSX files in the src directory
    // Add paths to other files or directories that might contain Tailwind classes,
    // e.g., "./public/index.html" or specific component libraries.
  ],

  // The `theme` object is where you define your project's design system.
  // You can customize or extend Tailwind's default theme here.
  theme: {
    // `extend` allows you to add new values to the default theme or override existing ones.
    extend: {
      // Example: Adding custom colors
      // colors: {
      //   'custom-blue': '#243c5a',
      //   'brand-primary': '#ff6347',
      // },

      // Example: Adding custom fonts
      // fontFamily: {
      //   sans: ['Inter var', 'sans-serif'],
      //   serif: ['Georgia', 'serif'],
      // },

      // Example: Customizing spacing scale
      // spacing: {
      //   '128': '32rem',
      // },

      // Example: Customizing breakpoints
      // screens: {
      //   '3xl': '1920px',
      // },
    },
  },

  // The `plugins` array allows you to register additional Tailwind CSS plugins.
  // Plugins can add new utility classes, components, or base styles.
  plugins: [
    // Example: Adding the official Tailwind CSS forms plugin
    // require('@tailwindcss/forms'),
    // Example: Adding the official Tailwind CSS typography plugin
    // require('@tailwindcss/typography'),
  ],

  // Other Tailwind CSS options can be configured here, such as:
  // variants: {}, // For configuring variants (hover, focus, etc.) in older Tailwind versions
  // corePlugins: {}, // To disable specific core plugins
  // prefix: '', // To add a prefix to all Tailwind classes
  // important: false, // To make Tailwind utilities !important (use with caution)
};
