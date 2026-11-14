import Link from "next/link";
import { categories } from "@/lib/catalog";
import { Photo } from "./Photo";

function CategoryCard({ index, tall = false }: { index: number; tall?: boolean }) {
  const c = categories[index];
  return (
    <Link href={`/loja?categoria=${encodeURIComponent(c.label)}`} className={`cat${tall ? " cat--tall" : ""}`}>
      <Photo label={c.photo}>
        <span className={`cat__tag cat__tag--${c.tone}`}>{c.label}</span>
      </Photo>
    </Link>
  );
}

export function Categories() {
  return (
    <section id="categorias" className="container cats">
      <div className="cats__grid">
        <CategoryCard index={0} tall />
        <div className="cats__intro">
          <h2 className="display">Do primeiro passo à escola.</h2>
          <p className="muted">
            Numeração do C4 ao J3, separada por idade. Na dúvida, meça o pezinho em centímetros e mande pra gente:
            indicamos o número certo.
          </p>
          <Link href="/loja" className="btn btn--tinta" style={{ alignSelf: "flex-start" }}>
            Ver todos os modelos
          </Link>
        </div>
        <CategoryCard index={1} />
        <CategoryCard index={2} />
        <CategoryCard index={3} />
      </div>
    </section>
  );
}
