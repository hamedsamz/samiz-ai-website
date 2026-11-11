import type { NextConfig } from "next";

const noStore = { key: "Cache-Control", value: "private, no-store, max-age=0" };
const privacy = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "CDN-Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/academy/:path*", headers: [
        noStore, ...privacy,
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ] },
      { source: "/api/auth/:path*", headers: [noStore, ...privacy] },
      { source: "/api/academy-media/:path*", headers: [noStore, ...privacy] },
    ];
  },
};

export default nextConfig;
