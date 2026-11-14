import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { SellersAdmin } from "@/components/admin/SellersAdmin";
import { EmptyState } from "@/components/EmptyState";
import { getAdminSellers } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

export default async function VendedorasPage() {
  const result = await getAdminSellers();
  if (result.status === "unauthorized") redirect("/admin/login");

  return (
    <>
      <div className="admin__bar">
        <div>
          <span className="pill pill--rosa">Painel</span>
          <h1 className="display h2">Vendedoras</h1>
        </div>
      </div>
      <AdminNav current="vendedoras" />
      {result.status === "unavailable" ? (
        <EmptyState role="alert" eyebrow="Ops" title="Não consegui falar com o servidor"
          actions={
            <a href="/admin/vendedoras" className="btn btn--tinta">
              Recarregar
            </a>
          }
        >
          A API não respondeu agora. Confira se ela está rodando e recarregue.
        </EmptyState>
      ) : (
        <SellersAdmin sellers={result.sellers} />
      )}
    </>
  );
}
