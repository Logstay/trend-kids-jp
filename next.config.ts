import type { NextConfig } from "next";

// `npm run export` gera um site 100% estático em ./out (serve em qualquer hospedagem).
// `npm run build` mantém o modo normal do Next.js (necessário quando a loja/painel
// passarem a ter rotas de servidor).
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isStaticExport ? { output: "export" as const, images: { unoptimized: true } } : {}),
};

export default nextConfig;
