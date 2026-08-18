import type { NextConfig } from "next";

const rawApiUrl = process.env.API_URL ?? "http://localhost:8081";
const apiUrl = (
    /^https?:\/\//.test(rawApiUrl) ? rawApiUrl : `https://${rawApiUrl}`
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/auth/:path*",
                destination: `${apiUrl}/api/auth/:path*`,
            },
            {
                source: "/api/workspaces/:path*",
                destination: `${apiUrl}/api/workspaces/:path*`,
            },
            {
                source: "/api/workspaces",
                destination: `${apiUrl}/api/workspaces`,
            },
            {
                source: "/api/memory/:path*",
                destination: `${apiUrl}/api/memory/:path*`,
            },
            {
                source: "/api/memory",
                destination: `${apiUrl}/api/memory`,
            },
        ];
    },
};

export default nextConfig;
