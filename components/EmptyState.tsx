import type { ReactNode } from "react";

type Props = {
  /** `landing` é a versão grande, para a vitrine da página inicial; `compact` serve a listagens e painéis. */
  variant?: "compact" | "landing";
  eyebrow?: string;
  title: string;
  /** Tag do título, para respeitar a hierarquia da página onde o estado aparece. */
  as?: "h2" | "h3";
  children?: ReactNode;
  actions?: ReactNode;
  /** `status` para estados que surgem sem recarregar a página (filtros); `alert` para falhas. */
  role?: "status" | "alert";
  className?: string;
};

/**
 * Estado vazio do design system: bloco rosa-claro (radius-lg) com a logo da loja como marca-d'água
 * translúcida, texto à esquerda e ações. A logo é só decoração (CSS, sem alt).
 */
export function EmptyState({ variant = "compact", eyebrow, title, as: Title = "h2", children, actions, role, className = "" }: Props) {
  return (
    <div className={`empty empty--${variant} ${className}`} role={role}>
      <span className="empty__mark" aria-hidden="true" />
      <div className="empty__body">
        {eyebrow && <span className="pill pill--rosa">{eyebrow}</span>}
        <Title className="display empty__title">{title}</Title>
        {children && <p className="muted empty__text">{children}</p>}
        {actions && <div className="empty__actions">{actions}</div>}
      </div>
    </div>
  );
}
