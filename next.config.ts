import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "next-pwa";
import type { Configuration } from "webpack";

/** Inlined into `public/worker-*.js` — that bundle has no `process` (next-pwa uses a separate webpack). */
const NEXT_PUBLIC_FIREBASE_SW_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
] as const;

const withNextIntl = createNextIntlPlugin();

const pwaRevision =
  process.env.GIT_COMMIT_SHA ??
  process.env.npm_package_version ??
  Date.now().toString();

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  /** Explicit: default next-pwa `true` reloads the tab on `online` and can drop form state. */
  reloadOnOnline: false,
  /** Large chunks; keep above default 2 MiB so big client bundles still precache. */
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  /**
   * Source maps are still listed as webpack assets, but Sentry deletes them after
   * upload (`deleteSourcemapsAfterUpload`). Precaching them causes `bad-precaching-response`
   * (404) and failed SW install.
   */
  buildExcludes: [/\.map$/i],
  manifestTransforms: [
    async (
      manifestEntries: Array<{ url: string; revision?: string | null }>,
    ) => ({
      manifest: manifestEntries.filter((entry) => !entry.url.includes(".map")),
      warnings: [],
    }),
  ],
  disable: process.env.NODE_ENV === "development",
  cacheStartUrl: false,
  dynamicStartUrl: false,
  customWorkerDir: "worker",
  additionalManifestEntries: [
    { url: "/manifest.json", revision: pwaRevision },
    { url: "/favicon.ico", revision: pwaRevision },
    { url: "/pwa/icon-192x192.png", revision: pwaRevision },
    { url: "/pwa/icon-192x192-maskable.png", revision: pwaRevision },
    { url: "/pwa/icon-512x512.png", revision: pwaRevision },
    { url: "/pwa/icon-512x512-maskable.png", revision: pwaRevision },
  ],
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/[^/]+\/_next\/static\/.*$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static-assets",
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    // 3. Logo image served via _next/image
    {
      urlPattern: /^https?:\/\/[^/]+\/_next\/image\?url=%2Flogo\.png/i,
      handler: "CacheFirst",
      options: {
        cacheName: "logo-image",
        expiration: {
          maxEntries: 10, // multiple widths ok
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern:
        /^https?:\/\/[^/]+\/(?:apple-touch-icon(?:-precomposed)?\.png|assets\/images\/.*)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "app-static-files",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ],
});

const cloudinaryPathname = process.env.CLOUDINARY_CLOUD_NAME
  ? `/${process.env.CLOUDINARY_CLOUD_NAME}/**`
  : "/**";

type AppImageRemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  pathname: string;
};

function appOriginImagePatterns(): AppImageRemotePattern[] {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) {
    return [];
  }
  try {
    const { hostname } = new URL(raw);
    const patterns: AppImageRemotePattern[] = [
      { protocol: "https", hostname, pathname: "/**" },
    ];
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      patterns.push({ protocol: "http", hostname, pathname: "/**" });
    }
    return patterns;
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["swagger-jsdoc", "isomorphic-dompurify", "bullmq"],
  webpack(config: Configuration, { webpack, isServer }) {
    if (!isServer) {
      const define: Record<string, string> = {};
      for (const key of NEXT_PUBLIC_FIREBASE_SW_ENV_KEYS) {
        define[`process.env.${key}`] = JSON.stringify(process.env[key] ?? "");
      }
      config.plugins?.push(new webpack.DefinePlugin(define));
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: cloudinaryPathname,
      },
      ...appOriginImagePatterns(),
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.modawim.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

const configWithPlugins = withPWA(withNextIntl(nextConfig));

/** Aligns uploaded artifacts with runtime when set; otherwise the plugin auto-detects from git/CI. */
const sentryReleaseName =
  process.env.SENTRY_RELEASE?.trim() ||
  process.env.GIT_COMMIT_SHA?.trim() ||
  undefined;

export default withSentryConfig(configWithPlugins, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: false,
  useRunAfterProductionCompileHook: false,
  sourcemaps: {
    disable: true,
  },
  ...(sentryReleaseName ? { release: { name: sentryReleaseName } } : {}),
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});
