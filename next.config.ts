import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const withNextIntl = createNextIntlPlugin("./i18n/request.js");

const nextConfig: NextConfig = {
  output: "standalone",
  sassOptions: {
    additionalData: `@use "${path.resolve(process.cwd(), 'styles/_variables.scss').replace(/\\/g, '/')}" as *;`,
  },
  allowedDevOrigins: ["e789-84-54-116-4.ngrok-free.app"], // Next.js 15+
};

export default withNextIntl(nextConfig);
