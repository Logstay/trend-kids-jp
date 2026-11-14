import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { hasAdminSession } from "@/lib/admin-server";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const settings = await getSettings({ fresh: true }); // no painel nunca mostra dado em cache

  return (
    <>
      <div className="admin__bar">
        <div>
          <span className="pill pill--rosa">Painel</span>
          <h1 className="display h2">Contato da loja</h1>
        </div>
      </div>
      <AdminNav current="configuracoes" />
      <SettingsForm initial={settings} />
    </>
  );
}
