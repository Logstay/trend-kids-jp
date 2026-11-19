import Link from "next/link";
import { ArrowRight, HangerIcon } from "./icons";
import { Photo } from "./Photo";
import type { Product } from "@/lib/catalog";

/**
 * `fromPrice` vem do menor preço real do catálogo; sem produtos, a etiqueta não aparece.
 * `product` é o produto sorteado (com foto) para o destaque; sem ele, fica o bloco de foto a fazer.
 */
export function Hero({
  fromPrice,
  product,
  launchesHref = "#novidades",
}: {
  fromPrice?: string | null;
  product?: Product | null;
  launchesHref?: string;
}) {
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
              {launchesHref.startsWith("#") ? (
                <a href={launchesHref} className="btn btn--lg btn--creme">
                  Lançamentos
                </a>
              ) : (
                <Link href={launchesHref} className="btn btn--lg btn--creme">
                  Lançamentos
                </Link>
              )}
            </div>
          </div>
          <div className="hero__media">
            {product ? (
              <Link href={product.slug ? `/loja/${product.slug}` : "/loja"} className="hero__link">
                <Photo label={product.name} src={product.image} priority />
              </Link>
            ) : (
              <Photo label="Foto real: par de Crocs Classic com charms, fundo creme" icon={<HangerIcon />} />
            )}
            {fromPrice && <span className="hero__price">Crocs infantil a partir de {fromPrice}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
