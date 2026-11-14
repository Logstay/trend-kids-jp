import { site, whatsappLink } from "@/lib/site";
import { InstagramIcon, WhatsAppIcon } from "./icons";
import { Photo } from "./Photo";

export function Story() {
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
          <a href={whatsappLink()} className="btn btn--tinta" target={site.whatsapp ? "_blank" : undefined} rel="noopener noreferrer">
            <WhatsAppIcon /> Peça pelo WhatsApp
          </a>
          <a
            href={site.instagramUrl || "#contato"}
            className="btn btn--outline"
            target={site.instagramUrl ? "_blank" : undefined}
            rel="noopener noreferrer"
          >
            <InstagramIcon /> {site.instagram}
          </a>
        </div>
      </div>
    </section>
  );
}
