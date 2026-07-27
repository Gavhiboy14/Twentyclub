/**
 * Slug único dentro de una colección: si "adidas-samba" ya existe, prueba
 * "adidas-samba-2", "-3", etc.
 */
export function uniqueSlug(base: string, taken: Iterable<string>) {
  const used = new Set(taken);
  const root = base || "item";
  let slug = root;
  let n = 2;
  while (used.has(slug)) slug = `${root}-${n++}`;
  return slug;
}
