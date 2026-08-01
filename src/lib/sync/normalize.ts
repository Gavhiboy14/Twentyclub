/* ==========================================================================
   Normalización

   El proveedor escribe a mano en una planilla, así que el mismo par aparece
   como "Knu Skool" y "KNU SKOOL", o con acentos de más. Todo lo que compara
   texto en este módulo pasa primero por `canonical`, y el matcheo exacto se
   hace siempre sobre esa forma — nunca sobre lo que se ve en pantalla.
   ========================================================================== */

/** Forma comparable: sin acentos, sin puntuación, sin mayúsculas, sin dobles espacios. */
export function canonical(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // marcas de acento, ya separadas por NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Siglas que no deben quedar capitalizadas a medias. */
const ACRONYMS = new Set(["sb", "dc", "sl", "xl", "og", "tn", "af1"]);

/** Capitaliza respetando siglas: "KNU SKOOL" → "Knu Skool", "adi sl" → "Adi SL". */
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/(\s+)/)
    .map((part) => {
      if (!part.trim()) return part;
      if (ACRONYMS.has(part)) return part.toUpperCase();
      return part[0].toUpperCase() + part.slice(1);
    })
    .join("");
}

/**
 * Similitud por tokens (Dice sobre bigramas de palabras + palabras sueltas).
 *
 * Se usa sólo para el primer cruce, cuando los productos de la tienda todavía
 * no tienen referencia del proveedor. Es a propósito conservador: preferimos
 * crear un producto nuevo y que el admin lo una, antes que pisar el par
 * equivocado.
 */
export function similarity(a: string, b: string): number {
  const left = new Set(canonical(a).split(" ").filter(Boolean));
  const right = new Set(canonical(b).split(" ").filter(Boolean));
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared++;
  return (2 * shared) / (left.size + right.size);
}

/**
 * Saca el nombre de la marca del texto antes de compararlo.
 *
 * El cruce se hace siempre dentro de una misma marca, así que esa palabra no
 * distingue nada: lo único que hace es diluir el parecido. El proveedor
 * escribe "Vans Ultraranger" y en la tienda el producto se llama
 * "UltraRanger" — con la marca adentro eso da 0.67 y no llega al umbral; sin
 * ella da 1 y se vincula solo, que es lo que uno espera.
 *
 * El color **no** se toca, a propósito: "Gazelle Celeste" y "Gazelle Bordó"
 * son dos productos distintos del catálogo, y borrarlo los volvería
 * indistinguibles entre sí.
 */
export function withoutBrand(value: string, brandName: string): string {
  const brandTokens = new Set(canonical(brandName).split(" ").filter(Boolean));
  if (!brandTokens.size) return canonical(value);
  return canonical(value)
    .split(" ")
    .filter((token) => token && !brandTokens.has(token))
    .join(" ");
}

/* --------------------------------- Color ---------------------------------- */

/**
 * Diccionario de colores tal como los escribe el proveedor, con la variante
 * en femenino y plural que usa para el calzado ("blanca", "Negras").
 */
const COLORS: { match: RegExp; name: string; hex: string }[] = [
  { match: /\b(negr[ao]s?|black)\b/, name: "Negro", hex: "#1b1b1d" },
  { match: /\b(blanc[ao]s?|white)\b/, name: "Blanco", hex: "#ededea" },
  { match: /\b(gris(es)?|grey|gray|grafitti|graffiti)\b/, name: "Gris", hex: "#8b8b8f" },
  { match: /\b(bordo|burgundy|vino)\b/, name: "Bordó", hex: "#6d2836" },
  { match: /\b(roj[ao]s?|red|bred)\b/, name: "Rojo", hex: "#a3342e" },
  { match: /\b(azul(es)?|blue|navy)\b/, name: "Azul", hex: "#2f4058" },
  { match: /\b(verde|green)\b/, name: "Verde", hex: "#4a5f45" },
  { match: /\b(marron|marrón|brown|cafe|café)\b/, name: "Marrón", hex: "#6b4c35" },
  { match: /\b(beige|crema|cream|hueso)\b/, name: "Beige", hex: "#d9cfbc" },
  { match: /\b(rosa|pink|rosado)\b/, name: "Rosa", hex: "#c79098" },
  { match: /\b(lila|violet[ao]|purple)\b/, name: "Lila", hex: "#8b7f9e" },
  { match: /\b(celeste|sky)\b/, name: "Celeste", hex: "#93a8bd" },
  { match: /\b(amarill[ao]s?|yellow)\b/, name: "Amarillo", hex: "#c9a961" },
  { match: /\b(naranja|orange)\b/, name: "Naranja", hex: "#bd7f5f" },
  { match: /\b(oro|dorad[ao]s?|gold)\b/, name: "Dorado", hex: "#c9a063" },
  { match: /\b(plata|platead[ao]s?|silver)\b/, name: "Plata", hex: "#a9a9ad" },
];

export function detectColor(model: string): { color: string; colorHex: string } {
  const text = canonical(model);
  for (const entry of COLORS) {
    if (entry.match.test(text)) return { color: entry.name, colorHex: entry.hex };
  }
  return { color: "", colorHex: "#b4b0a0" };
}

/* -------------------------------- Modelo ---------------------------------- */

/**
 * Nombre comercial de arranque para un producto nuevo.
 *
 * Es sólo el punto de partida: el nombre es un campo propio de Twenty Club y
 * a partir de la primera importación no lo toca nadie más que el admin. La
 * coma que usa el proveedor para separar la variante se convierte en espacio.
 */
export function displayName(model: string): string {
  return titleCase(model.replace(/\s*,\s*/g, " ").replace(/\s+/g, " ").trim());
}

/**
 * Clave con la que un producto de la tienda queda atado a su fila del PDF.
 * Se guarda en `supplierRef` la primera vez y a partir de ahí el cruce es
 * exacto: el proveedor puede reescribir mayúsculas o acentos sin romperlo.
 */
export function supplierKey(model: string): string {
  return canonical(model);
}
