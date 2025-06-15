// next.config.js
// This file is used to configure various aspects of your Next.js application.
// It allows you to customize the build process, runtime behavior, environment variables,
// server settings, and more.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode helps identify potential problems in an application.
  // It activates additional checks and warnings for its descendants.
  reactStrictMode: true,

  // Environment variables can be exposed to the browser by prefixing them with NEXT_PUBLIC_.
  // env: {
  //   customKey: 'my-value',
  // },

  // Webpack customizations can be made here if needed.
  // webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
  //   // Important: return the modified config
  //   return config;
  // },

  // Redirects allow you to redirect an incoming request path to a different destination path.
  // async redirects() {
  //   return [
  //     {
  //       source: '/about-old',
  //       destination: '/about',
  //       permanent: true, // True for 308 permanent redirect, false for 307 temporary redirect.
  //     },
  //   ];
  // },

  // Rewrites allow you to map an incoming request path to a different destination path.
  // Rewrites act like a proxy and mask the destination path, so the URL appears unchanged to the user.
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/proxy/:path*',
  //       destination: 'https://example.com/api/:path*', // Proxy to an external API.
  //     },
  //   ];
  // },

  // Sentry configuration for source maps and release tracking.
  // This configuration is typically added by the Sentry wizard.
  // sentry: {
  //   // For all available options, see:
  //   // https://github.com/getsentry/sentry-webpack-plugin#options
  //
  //   // Suppresses source map uploading logs during build
  //   silent: true,
  //   org: "your-sentry-org",
  //   project: "your-sentry-project",
  // },
  //
  // // The following Sentry options generate source maps automatically and upload them to Sentry.
  // // This is particularly useful for server-side code in Next.js.
  // // Note: This might be part of a `withSentryConfig` HOC if you are using older Sentry SDK versions.
  // productionBrowserSourceMaps: true, // Generate source maps for browser production bundles.
};

export default nextConfig;

// If you are using Sentry and need to wrap your config with Sentry's HOC (older versions):
// import { withSentryConfig } from '@sentry/nextjs';
// export default withSentryConfig(
//   nextConfig,
//   {
//     // For all available options, see:
//     // https://github.com/getsentry/sentry-webpack-plugin#options
//
//     // Suppresses source map uploading logs during build
//     silent: true,
//     org: "your-sentry-org",
//     project: "your-sentry-project",
//   },
//   {
//     // For all available options, see:
//     // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
//
//     // Upload a larger set of source maps for prettier stack traces (increases build time)
//     widenClientFileUpload: true,
//
//     // Transpiles SDK to be compatible with IE11 (increases bundle size)
//     transpileClientSDK: false,
//
//     // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
//     tunnelRoute: "/monitoring",
//
//     // Hides source maps from generated client bundles
//     hideSourceMaps: true,
//
//     // Automatically tree-shake Sentry logger statements to reduce bundle size
//     disableLogger: true,
//
//     // Enables automatic instrumentation of Vercel Cron Monitors.
//     // See the following for more information:
//     // https://docs.sentry.io/ zowel commons als commonsense
//     // https://vercel.com/docs/cron-jobs
//     automaticVercelMonitors: true,
//   }
// );
