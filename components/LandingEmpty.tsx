import { EmptyState } from "./EmptyState";
import { WhatsAppIcon } from "./icons";
import { getSettings, whatsappHref } from "@/lib/settings";

const coming = ["Classic", "Com luz", "Sandálias", "Forrados", "Charms"];

/** Vitrine da landing quando a loja ainda não tem nenhum produto cadastrado. */
export async function LandingEmpty() {
  const site = await getSettings();
  return (
    <section id="novidades" className="container landing-empty">
      <EmptyState variant="landing" eyebrow="Em breve" title="A vitrine está sendo montada" as="h2" className="empty--has-chips"
        actions={
          <>
            <a href={whatsappHref(site, "Olá! Quero saber o que acabou de chegar de Crocs infantis.")} className="btn btn--lg btn--tinta">
              <WhatsAppIcon /> Chamar no WhatsApp
            </a>
            {site.instagram_url && (
              <a href={site.instagram_url} className="btn btn--lg btn--creme" rel="noopener noreferrer">
                Ver no Instagram
              </a>
            )}
          </>
        }
      >
        Estamos separando cada par com carinho. Chama a gente no WhatsApp e mostramos o que acabou de chegar.
        <span className="empty__chips" aria-label="Coleções que estão chegando">
          {coming.map((c) => (
            <span key={c} className="empty__chip">
              {c}
            </span>
          ))}
        </span>
      </EmptyState>
    </section>
  );
}
