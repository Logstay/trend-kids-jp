import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function ProdutoNaoEncontrado() {
  return (
    <>
      <Header />
      <main className="container" style={{ paddingBlock: "48px 96px" }}>
        <EmptyState eyebrow="404" title="Produto não encontrado"
          actions={
            <Link href="/loja" className="btn btn--tinta">
              Ver todos os modelos
            </Link>
          }
        >
          Esse modelo não está mais disponível ou o link está errado. Dê uma olhada nos outros pares da loja.
        </EmptyState>
      </main>
      <Footer />
    </>
  );
}
