import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const withNextIntl = createNextIntlPlugin("./i18n/request.js");

// standalone нужен только для Docker-образа (см. Dockerfile, GitLab CI).
// На Vercel сборка своя, и standalone там лишний: он копирует node_modules
// в .next/standalone и раздувает артефакт впустую.
const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { output: "standalone" as const }),
  sassOptions: {
    additionalData: `@use "${path.resolve(process.cwd(), 'styles/_variables.scss').replace(/\\/g, '/')}" as *;`,
  },
  // Разрешённые источники для dev-сервера (ngrok и прочие туннели).
  // На проде не используется.
  allowedDevOrigins: ["b0d9-84-54-116-4.ngrok-free.app"],
};

export default withNextIntl(nextConfig);
