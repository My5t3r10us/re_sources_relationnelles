import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Hôte du bucket public, dérivé de la configuration plutôt qu'écrit en dur.
 *
 * `remotePatterns` valait auparavant `hostname: "**"` en http ET https :
 * l'optimiseur d'images acceptait donc n'importe quelle URL distante, ce qui
 * en faisait un proxy ouvert capable d'atteindre des adresses internes depuis
 * l'intérieur du réseau (SSRF).
 */
function bucketImagePattern() {
  const raw = process.env.AWS_PUBLIC_URL ?? "https://resources.t3.tigrisfiles.io";
  try {
    const url = new URL(raw);
    return {
      protocol: "https" as const,
      hostname: url.hostname,
      pathname: "/**",
    };
  } catch {
    return { protocol: "https" as const, hostname: "resources.t3.tigrisfiles.io", pathname: "/**" };
  }
}

const isProd = process.env.NODE_ENV === "production";

/**
 * CSP appliquée immédiatement.
 *
 * `script-src` et `style-src` restent permissifs : Next.js injecte des scripts
 * et des styles inline, et les durcir sans nonce casserait le rendu. Les
 * directives ci-dessous sont en revanche sûres à appliquer telles quelles et
 * ferment le clickjacking, l'injection de <base>, le détournement de
 * formulaire et le chargement de plugins.
 *
 * Étape suivante recommandée : nonce par requête généré dans `proxy.ts`, puis
 * `script-src 'self' 'nonce-<...>' 'strict-dynamic'`.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "media-src 'self' https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Double protection contre le clickjacking du panneau d'administration,
  // pour les navigateurs qui ignorent `frame-ancestors`.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // N'annonce pas la version du framework.
  poweredByHeader: false,
  images: {
    remotePatterns: [bucketImagePattern()],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          // HSTS uniquement en production : en développement l'application est
          // servie en http sur localhost, et l'en-tête y serait piégeant.
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
