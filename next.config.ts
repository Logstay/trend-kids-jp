import type { NextConfig } from "next";

// `npm run export` gera um site 100% estático em ./out (serve em qualquer hospedagem).
// `npm run build` mantém o modo normal do Next.js (necessário quando a loja/painel
// passarem a ter rotas de servidor).
const isStaticExport = process.env.STATIC_EXPORT === "1";

// O painel fala com a API pelo próprio site (/api/* -> API em Go). Assim o cookie de sessão nasce na
// origem do site: funciona em qualquer domínio, sem CORS e sem depender de SameSite entre hosts.
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
  ...(isStaticExport ? { output: "export" as const, images: { unoptimized: true } } : {}),
};

export default nextConfig;
