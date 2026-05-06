import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.js");

const nextConfig: NextConfig = {
  output: "standalone",
  sassOptions: {
    additionalData: `@use "${path.resolve(process.cwd(), 'styles/_variables.scss').replace(/\\/g, '/')}" as *;`,
  },
};

export default withNextIntl(nextConfig);
