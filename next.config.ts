import type { NextConfig } from "next"

const csp = [
  `default-src 'self'`,
  // 'unsafe-inline' and 'unsafe-eval' are required for Radix UI and Framer Motion
  // Consider using nonces or hashes in future for stricter CSP
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
  // Additional security directives
  `block-all-mixed-content`,
  `require-sri-for 'script' 'style'`,
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.in",
      },
    ],
  },
  turbopack: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // XSS Protection
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },

          // HTTPS enforcement
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },

          // Permissions Policy (formerly Feature Policy)
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },

          // Content Security Policy
          { key: "Content-Security-Policy", value: csp.join("; ") },

          // Cross-Origin policies
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },

          // Cache control for sensitive pages
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ]
  },
}

export default nextConfig
