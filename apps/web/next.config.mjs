/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@khal/ui", "@khal/domain", "@khal/sync-engine", "@khal/sqlite-core"]
};

export default nextConfig;