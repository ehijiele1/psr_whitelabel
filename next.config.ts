import type { NextConfig } from "next"

// Content Security Policy
// - 'unsafe-inline' required by Radix UI + Tailwind runtime styles
// - 'unsafe-eval' required by Framer Motion and some Radix primitives
// - Paystack scripts/frames are explicitly allowlisted
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://*.supabase.co`,
  `font-src 'self' fonts.gstatic.com`,
  `connect-src 'self' https://*.supabase.co https://api.paystack.co https://api.ebulksms.com https://api.resend.com`,
  `frame-src https://js.paystack.co`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
  `block-all-mixed-content`,
].join("; ")

// Shared security headers applied to ALL routes
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // payment= omitted so Paystack's Payment Request API is not blocked.
  // camera/mic/geo are disabled as this app never needs them.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
  // same-origin-allow-popups lets Paystack's payment popup communicate back
  // to this page while still preventing malicious page hijacking.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // require-corp is intentionally omitted: it would block Paystack's iframe
  // unless Paystack sent CORP headers, which they do not.
]

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
    ],
  },

  turbopack: {},

  async headers() {
    return [
      {
        // ── Sensitive routes: never cache ──────────────────────────────────
        // Auth, API, and dashboard pages must not be stored in any cache to
        // prevent one user's session data from being served to another.
        source: "/(api|dashboard|login|register|setup|onboarding|invite|reset-password)(.*)",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        // ── Public / marketing pages: allow short-lived caching ─────────────
        // Home, onboarding wizard landing, and other public pages can be cached
        // by CDN and browsers for up to 1 hour, with a 24 h stale-while-revalidate
        // window so users get fast loads on revisit.
        source: "/((?!api|dashboard|login|register|setup|onboarding|invite|reset-password).*)",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ]
  },
}

export default nextConfig
