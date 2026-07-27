# Twenty Club

Tienda de zapatillas con panel administrador. Next.js 15 (App Router) + React 19
+ TypeScript + Tailwind CSS v4 + Framer Motion. Todo el texto de cara al usuario
va en español rioplatense.

## Cómo está armado

```
src/
  app/
    (site)/            Tienda pública. Su layout fuerza `dynamic = "force-dynamic"`.
    admin/login/       Login sin el shell del panel.
    admin/(panel)/     Panel: dashboard, productos, pedidos, marcas, etc.
    api/               Route handlers. /api/admin/* exige sesión.
  components/
    ui/                Primitivos (botón, glass, campos, controles Radix).
    site/              Chrome de la tienda: navbar, footer, hero, carrito.
    product/           Tarjeta, grilla, galería, filtros, panel de compra.
    admin/             Formularios y tablas del panel.
    motion/            Reveal / Stagger — el movimiento base del sitio.
  lib/
    data/repo.ts       Contrato de persistencia (DataRepo). Nada más lo implementa.
    data/store.ts      Elige el driver según DATA_DRIVER. Punto de entrada único.
    data/drivers/      local.ts (.data/db.json) y supabase.ts (Postgres+Storage).
    data/mapping.ts    Traducción snake_case (Postgres) ↔ camelCase (app).
    data/seed.ts       Catálogo semilla reproducible.
    data/queries.ts    Consultas del sitio y del panel (sólo servidor).
    catalog.ts         Tipos y etiquetas que el cliente también necesita.
    admin/             Guard de sesión, esquemas zod, metadatos de pedidos.
  store/               Contextos de cliente: carrito, favoritos, vistos.
```

## Reglas que importan

**No importes `lib/data/store.ts` ni `lib/data/queries.ts` desde un componente
`"use client"`.** Arrastra `node:fs` al bundle del navegador y el build falla con
`UnhandledSchemeError`. Lo que el cliente necesite (tipos, constantes de orden,
facets) va en `lib/catalog.ts`.

**Tampoco importes valores no-componente desde un módulo `"use client"` hacia un
Server Component.** Llegan como referencias del cliente, no como el dato. Por eso
`FAQ_ITEMS` vive en `lib/content/faq.ts` y no en `components/site/faq.tsx`.

**Toda la persistencia pasa por `DataRepo`** (`lib/data/repo.ts`). Hay dos
implementaciones en `lib/data/drivers/` — archivo local y Supabase — y se elige
con `DATA_DRIVER`. Ninguna página ni route handler importa un driver directo:
usan `repo()` y `readDb()` de `lib/data/store.ts`. Si agregás una operación de
escritura, va al contrato y a las dos implementaciones.

`snapshot()` trae la base entera y se filtra en memoria; es deliberado para este
tamaño de catálogo. Las escrituras sí son puntuales.

**Las columnas de Postgres son snake_case y los tipos camelCase.** La traducción
vive sólo en `lib/data/mapping.ts`. Si agregás una columna, ese es el archivo.

**`local` y `supabase` son dos bases separadas, no una vista de la otra.** Con
`DATA_DRIVER=local`, todo lo que se sube por el panel (fotos a
`public/uploads`, productos a `.data/db.json`) queda sólo en el disco de quien
lo corrió — las dos rutas están en `.gitignore` a propósito. Netlify siempre
lee de Supabase. Cargar catálogo real con el driver local y esperar que
aparezca en producción es el error más probable acá; ver el aviso en
`docs/DEPLOY-NETLIFY.md` (paso 4). `scripts/seed-supabase.mjs` migra las tres
carpetas de imágenes (`products`, `brands`, `uploads`) — si agregás una carpeta
nueva de assets subidos, hay que sumarla ahí también.

**`schema.partial()` no alcanza para un PATCH.** Zod aplica los `.default()` de
los campos ausentes, así que guardar sólo el stock borraría las imágenes. Todo
PATCH tiene que pasar por `onlySent(raw, parsed.data)` de `lib/admin/guard.ts`.

**La paleta sale del logo y no tiene un tercer color.** Carbón cálido
(`--color-ink` #302f2b) y crema (`--color-cream` #f7f4e0). La jerarquía la marca
el brillo, no el matiz: `chalk` para títulos, `mist` para cuerpo, `ash` para
microcopy. El acento también es crema — por eso el botón principal es crema
sólido con texto oscuro, y hay uno solo por pantalla.

Las veladuras del glass van en crema (`bg-cream/[0.05]`), nunca en blanco puro:
sobre carbón cálido el blanco se ve azulado.

**Colores fuertes sólo para estados**, y apagados: `ok` verde salvia (pedido
finalizado), `warn` ámbar (stock bajo), `bad` terracota (agotado). Todos los
tokens están en `app/globals.css` bajo `@theme`.

**La chispa de cuatro puntas** (`<Sparkle />` en `components/site/logo.tsx`) es
el único adorno de la marca. Se usa en el lockup y en el antetítulo del hero. No
la repartas por la página.

**Los talles agotados desaparecen solos.** `visibleSizes()` filtra por
`available && stock > 0`; ningún componente debería recalcular esa regla.

**Los precios del pedido se recalculan en el servidor.** `/api/orders` ignora lo
que manda el navegador y arma el total desde la base.

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción
npm run typecheck     # tsc --noEmit
npm run gen:images    # regenera los SVG de catálogo desde scripts/colorways.json
npm run seed:supabase # migra .data/db.json + imágenes locales a Supabase
```
