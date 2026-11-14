import Link from "next/link";
import { ArrowRight, HangerIcon } from "./icons";
import { Photo } from "./Photo";

/** `fromPrice` vem do menor preço real do catálogo; sem produtos, a etiqueta não aparece. */
export function Hero({ fromPrice }: { fromPrice?: string | null }) {
  return (
    <section className="container hero">
      <div className="hero__wrap">
        <div aria-hidden="true" className="hero__shape hero__shape--azul" />
        <div aria-hidden="true" className="hero__shape hero__shape--rosa" />
        <div className="hero__card">
          <div className="hero__text">
            <span className="pill pill--creme">Crocs infantis</span>
            <h1 className="display hero__title">Crocs para pés que não param.</h1>
            <p className="hero__lead">
              Leves, laváveis e confortáveis do primeiro passo à escola. Com charms para deixar do jeito deles.
            </p>
            <div className="hero__ctas">
              <Link href="/loja" className="btn btn--lg btn--tinta">
                Ver a loja <ArrowRight />
              </Link>
              <a href="#novidades" className="btn btn--lg btn--creme">
                Lançamentos
              </a>
            </div>
          </div>
          <div className="hero__media">
            <Photo label="Foto real: par de Crocs Classic com charms, fundo creme" icon={<HangerIcon />} />
            {fromPrice && <span className="hero__price">Crocs infantil a partir de {fromPrice}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
