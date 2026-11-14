// Dados da loja em um só lugar. Troque os valores entre colchetes antes de publicar.

export const site = {
  name: "Trend Kids JP",
  city: "João Pessoa · PB",
  description:
    "Crocs infantis em João Pessoa: Classic, com luz, sandálias e charms. Numeração do C4 ao J3 e entrega no mesmo dia em JP.",
  // Só dígitos, com DDI + DDD. Ex.: "5583999999999"
  whatsapp: "",
  instagram: "[@seu_instagram]",
  instagramUrl: "",
  fromPrice: "R$ [PREÇO]",
} as const;

export function whatsappLink(message = "Olá! Vim pelo site e quero saber dos Crocs infantis.") {
  if (!site.whatsapp) return "#contato";
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
