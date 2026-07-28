import type { Brand, ProductTag } from "@/lib/types";
import type { SyncRule } from "./types";
import { canonical } from "./normalize";

/* ==========================================================================
   Reglas de clasificación

   El PDF no trae columna de marca: viene metida en el modelo ("Dunk Panda",
   "Adi SL, Black", "Jordan Charol"). Las reglas son las que la deducen, y de
   paso asignan categorías y etiquetas.

   Se evalúan en orden y se acumulan: un producto puede caer en varias reglas
   y quedarse con las categorías de todas. La marca, en cambio, la fija la
   primera que acierta — un par no puede ser de dos marcas.
   ========================================================================== */

export interface RuleOutcome {
  brandId: string | null;
  categoryIds: string[];
  tags: ProductTag[];
  /** Reglas que acertaron, para poder mostrar por qué quedó así. */
  matched: string[];
}

function matches(rule: SyncRule, model: string): boolean {
  const haystack = canonical(model);
  const needle = canonical(rule.value);
  if (!needle) return false;
  return rule.operator === "es"
    ? haystack === needle
    : haystack.includes(needle);
}

export function applyRules(model: string, rules: SyncRule[]): RuleOutcome {
  const outcome: RuleOutcome = {
    brandId: null,
    categoryIds: [],
    tags: [],
    matched: [],
  };

  const ordered = rules
    .filter((rule) => rule.active)
    .sort((a, b) => a.order - b.order);

  for (const rule of ordered) {
    if (!matches(rule, model)) continue;
    outcome.matched.push(rule.id);
    if (rule.brandId && !outcome.brandId) outcome.brandId = rule.brandId;
    for (const id of rule.categoryIds) {
      if (!outcome.categoryIds.includes(id)) outcome.categoryIds.push(id);
    }
    for (const tag of rule.tags) {
      if (!outcome.tags.includes(tag)) outcome.tags.push(tag);
    }
  }

  return outcome;
}

/* ------------------------- Reglas de fábrica ------------------------------ */

/**
 * Palabras con las que el proveedor nombra cada marca, sacadas del catálogo
 * real. El orden importa: "Jordan" tiene que ganarle a "Air", porque
 * "Air Jordan" es Jordan y no Nike.
 */
const BRAND_KEYWORDS: { slug: string; words: string[] }[] = [
  { slug: "jordan", words: ["jordan"] },
  {
    slug: "adidas",
    words: [
      "adidas",
      "adizero",
      "adi ",
      "samba",
      "forum",
      "gazelle",
      "superstar",
      "supernova",
      "campus",
      "spezial",
    ],
  },
  { slug: "new-balance", words: ["new balance", "new bal"] },
  { slug: "vans", words: ["vans", "knu", "old skool", "ultraranger"] },
  { slug: "puma", words: ["puma", "suede"] },
  { slug: "converse", words: ["converse", "chuck"] },
  { slug: "reebok", words: ["reebok", "club c"] },
  { slug: "asics", words: ["asics", "gel"] },
  {
    slug: "nike",
    words: [
      "nike",
      "dunk",
      "air force",
      "air max",
      "blazzer",
      "blazer",
      "cortez",
      "pegasus",
      "shox",
      "zoom",
      "air",
    ],
  },
];

/**
 * Arma el juego de reglas inicial a partir de las marcas que ya existen en la
 * tienda. Las marcas que el proveedor vende y Twenty Club todavía no tiene
 * (Straye, Lacoste, DC, Fila) quedan sin regla a propósito: esos productos
 * caen en error y el admin decide si les crea la marca o los ignora.
 */
export function defaultRules(brands: Brand[]): SyncRule[] {
  const bySlug = new Map(brands.map((brand) => [brand.slug, brand.id]));
  const rules: SyncRule[] = [];
  let order = 0;

  for (const entry of BRAND_KEYWORDS) {
    const brandId = bySlug.get(entry.slug);
    if (!brandId) continue;
    for (const word of entry.words) {
      rules.push({
        id: `rule_${entry.slug}_${canonical(word).replace(/ /g, "_")}`,
        field: "modelo",
        operator: "contiene",
        value: word.trim(),
        brandId,
        categoryIds: [],
        tags: [],
        active: true,
        order: order++,
      });
    }
  }

  return rules;
}
