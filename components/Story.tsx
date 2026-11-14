import { getSettings } from "@/lib/settings";
import { InstagramIcon, WhatsAppIcon } from "./icons";
import { WhatsAppCta } from "./WhatsAppCta";
import { Photo } from "./Photo";

export async function Story() {
  const site = await getSettings();
  return (
    <section id="historia" className="container story">
      <div className="story__media">
        <div aria-hidden="true" className="story__shape" />
        <Photo label="Foto real: a parede de Crocs da loja" />
      </div>
      <div className="story__text">
        <span className="pill pill--rosa">Nossa história</span>
        <h2 className="display h2">Crocs para a criançada de João Pessoa, escolhido por quem também é mãe e pai.</h2>
        <p className="muted">
          [Conte aqui como a Trend Kids JP começou a vender Crocs: desde quando, por que escolheram a marca e como
          garantem a procedência de cada par.]
        </p>
        <div className="story__ctas">
          <WhatsAppCta message="Olá! Vim pelo site e quero saber dos Crocs infantis." className="btn btn--tinta">
            <WhatsAppIcon /> Peça pelo WhatsApp
          </WhatsAppCta>
          {site.instagram_url && (
            <a href={site.instagram_url} className="btn btn--outline" target="_blank" rel="noopener noreferrer">
              <InstagramIcon /> @{site.instagram}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
