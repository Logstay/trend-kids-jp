import type { CSSProperties, ReactNode } from "react";

type Props = {
  /** Descrição da foto que deve entrar aqui; vira o texto alternativo quando houver imagem. */
  label: string;
  src?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  icon?: ReactNode;
};

/**
 * Bloco de foto do design system: fundo rosa-claro e cantos radius-lg.
 * Sem `src`, mostra o que deve ser fotografado (placeholder honesto, nunca imagem de IA).
 */
export function Photo({ label, src, className = "", style, children, icon }: Props) {
  return (
    <div className={`photo ${className}`} style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="photo__img" src={src} alt={label} loading="lazy" />
      ) : (
        <>
          {icon}
          <span className="photo__label">{label}</span>
        </>
      )}
      {children}
    </div>
  );
}
