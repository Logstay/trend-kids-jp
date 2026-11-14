import { EmptyState } from "./EmptyState";
import { WhatsAppIcon } from "./icons";
import { WhatsAppCta } from "./WhatsAppCta";
import { getSettings } from "@/lib/settings";

const coming = ["Classic", "Com luz", "Sandálias", "Forrados", "Charms"];

type Props = { reason: "empty" | "error" };

/** Vitrine da landing sem produtos: "empty" = loja ainda vazia; "error" = o back não respondeu. */
export async function LandingEmpty({ reason }: Props) {
  const site = await getSettings();
  if (reason === "error") {
    return (
      <section id="novidades" className="container landing-empty">
        <EmptyState variant="landing" role="alert" eyebrow="Ops" title="Não conseguimos carregar a vitrine" as="h2"
          actions={
            <>
              <a href="/" className="btn btn--lg btn--tinta">
                Tentar de novo
              </a>
              <WhatsAppCta message="Olá! Quero ver os Crocs infantis disponíveis." className="btn btn--lg btn--creme">
                <WhatsAppIcon /> Chamar no WhatsApp
              </WhatsAppCta>
            </>
          }
        >
          Foi uma falha do nosso lado, não dos pares. Tente de novo em instantes ou chame a gente no WhatsApp.
        </EmptyState>
      </section>
    );
  }
  return (
    <section id="novidades" className="container landing-empty">
      <EmptyState variant="landing" eyebrow="Em breve" title="A vitrine está sendo montada" as="h2" className="empty--has-chips"
        actions={
          <>
            <WhatsAppCta message="Olá! Quero saber o que acabou de chegar de Crocs infantis." className="btn btn--lg btn--tinta">
              <WhatsAppIcon /> Chamar no WhatsApp
            </WhatsAppCta>
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
