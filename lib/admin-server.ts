import { cookies } from "next/headers";
import { API_URL, type ApiProduct } from "./api";

export type AdminProductsResult = { status: "ok"; products: ApiProduct[] } | { status: "unauthorized" } | { status: "unavailable" };

/**
 * Lê os produtos (inclusive inativos) no servidor, repassando o cookie de sessão que o navegador
 * mandou ao site. Sem sessão válida a API responde 401 e a página redireciona para o login.
 */
export async function getAdminProducts(): Promise<AdminProductsResult> {
  const session = (await cookies()).get("session")?.value;
  if (!session) return { status: "unauthorized" };

  try {
    const res = await fetch(`${API_URL}/v1/admin/products?limit=100&sort=newest`, {
      headers: { Cookie: `session=${session}` },
      cache: "no-store",
    });
    if (res.status === 401) return { status: "unauthorized" };
    if (!res.ok) return { status: "unavailable" };
    const body = (await res.json()) as { items: ApiProduct[] };
    return { status: "ok", products: body.items };
  } catch {
    return { status: "unavailable" };
  }
}
