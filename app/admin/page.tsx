import { redirect } from "next/navigation";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { EmptyState } from "@/components/EmptyState";
import { getAdminProducts } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const result = await getAdminProducts();
  if (result.status === "unauthorized") redirect("/admin/login");

  if (result.status === "unavailable") {
    return (
      <EmptyState role="alert" eyebrow="Ops" title="Não consegui falar com o servidor"
        actions={
          <a href="/admin" className="btn btn--tinta">
            Recarregar
          </a>
        }
      >
        A API não respondeu agora. Confira se ela está rodando e recarregue.
      </EmptyState>
    );
  }
  return <AdminProducts products={result.products} />;
}
