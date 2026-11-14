"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { hasAdminSession } from "@/lib/admin-server";

/**
 * Chamada pelo painel logo depois de salvar as configurações: faz o site público mostrar o novo
 * WhatsApp/Instagram na hora, em vez de esperar o cache expirar. Só quem tem sessão válida consegue.
 */
export async function revalidateSite(): Promise<void> {
  if (!(await hasAdminSession())) return;
  revalidateTag("settings");
  revalidatePath("/", "layout");
}
