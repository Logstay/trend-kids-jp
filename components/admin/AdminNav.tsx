import Link from "next/link";

const links = [
  { key: "produtos", href: "/admin", label: "Produtos" },
  { key: "vendedoras", href: "/admin/vendedoras", label: "Vendedoras" },
  { key: "configuracoes", href: "/admin/configuracoes", label: "Contato da loja" },
] as const;

export function AdminNav({ current }: { current: (typeof links)[number]["key"] }) {
  return (
    <nav aria-label="Painel" className="chips">
      {links.map((l) => (
        <Link key={l.key} href={l.href} className="chip" aria-current={current === l.key ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
