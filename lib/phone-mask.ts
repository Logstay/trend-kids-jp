/**
 * Máscara de telefone brasileiro enquanto a pessoa digita: "(83) 99999-1234" (celular) ou "(83) 3222-1234" (fixo).
 * Só mantém dígitos, tira o 55 do país quando colado com +55 e corta em 11 dígitos.
 * Não valida (o servidor valida): só organiza o que foi digitado.
 */
export function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  // Celular começa com 9 e tem 5 dígitos antes do traço; fixo tem 4.
  const split = rest[0] === "9" ? 5 : 4;
  if (rest.length <= split) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}
