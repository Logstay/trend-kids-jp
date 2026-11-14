import { redirect } from "next/navigation";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { getAdminProducts } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const result = await getAdminProducts();
  if (result.status === "unauthorized") redirect("/admin/login");

  if (result.status === "unavailable") {
    return (
      <p role="alert" className="muted">
        Não consegui falar com o servidor agora. Recarregue a página em instantes.
      </p>
    );
  }
  return <AdminProducts products={result.products} />;
}
