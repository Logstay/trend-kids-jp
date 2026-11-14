import { describe, expect, it } from "vitest";
import { footerLinks, homeSection, isSectionAnchor, navLinks } from "./nav";

describe("homeSection", () => {
  it("aponta para a seção da landing a partir de qualquer página", () => {
    expect(homeSection("novidades")).toBe("/#novidades");
  });
});

describe("links de navegação", () => {
  // Bug real: "#novidades" solto só funciona na landing; na /loja o clique não ia a lugar nenhum.
  it("nenhuma âncora de seção da landing é solta (todas usam /#id)", () => {
    for (const link of [...navLinks, ...footerLinks]) {
      if (link.href.startsWith("#")) {
        expect(link.href, `${link.label} é âncora solta`).toBe("#contato"); // o rodapé existe em todas as páginas
      }
    }
  });

  it("o menu leva às seções da landing pelo caminho completo", () => {
    const byLabel = Object.fromEntries(navLinks.map((l) => [l.label, l.href]));
    expect(byLabel["Novidades"]).toBe("/#novidades");
    expect(byLabel["Categorias"]).toBe("/#categorias");
    expect(byLabel["Nossa história"]).toBe("/#historia");
    expect(byLabel["Loja"]).toBe("/loja");
  });

  it("não repete destinos nem rótulos", () => {
    const labels = navLinks.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("isSectionAnchor", () => {
  // Medido no navegador: o <Link> do Next não rola para uma âncora na própria página; a âncora nativa rola.
  // Por isso links com # usam <a> nativo, e só páginas de verdade usam <Link>.
  it("links com # são âncoras (renderizados como <a> nativo)", () => {
    expect(isSectionAnchor("#contato")).toBe(true);
    expect(isSectionAnchor("/#historia")).toBe(true);
    expect(isSectionAnchor(homeSection("novidades"))).toBe(true);
  });

  it("páginas de verdade não são âncoras (usam <Link>)", () => {
    expect(isSectionAnchor("/loja")).toBe(false);
    expect(isSectionAnchor("/sacola")).toBe(false);
  });
});
