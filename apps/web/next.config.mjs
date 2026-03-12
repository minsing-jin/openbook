/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@openbook/core", "@openbook/importer", "@openbook/reader", "@openbook/ai"]
};

export default nextConfig;
