/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@khal/ui", "@khal/domain", "@khal/sync-engine", "@khal/excel-io"]
};

export default nextConfig;