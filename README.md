# Twenty Club

Tienda de zapatillas premium con panel administrador. Sin pago online: el cliente
arma el carrito y el pedido se cierra por WhatsApp con el resumen ya escrito.

- **Tienda** → [localhost:3000](http://localhost:3000)
- **Panel** → [localhost:3000/admin](http://localhost:3000/admin)

## Arrancar

```bash
npm install
cp .env.example .env.local
npm run dev
```

No necesitás credenciales de nada: el catálogo semilla (32 modelos, 9 marcas, 8
pedidos de ejemplo) se genera solo la primera vez en `.data/db.json`.

### Entrar al panel

| | |
| --- | --- |
| Email | `admin@twentyclub.com` |
| Contraseña | `twentyclub2026` |

Se configuran en `ADMIN_EMAIL` y `ADMIN_PASSWORD`. **Cambiá también `AUTH_SECRET`
antes de publicar el sitio** — es lo que firma la cookie de sesión.

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número que recibe los pedidos. También se edita desde el panel (Ajustes). |
| `NEXT_PUBLIC_SITE_URL` | Dominio real. Lo usan Open Graph, el sitemap y Schema.org. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Acceso al panel. |
| `AUTH_SECRET` | Firma de la cookie de sesión. Cadena larga y aleatoria. |
| `DATA_DRIVER` | `local` (por defecto) o `supabase`. |

## Qué hay adentro

**Tienda**

- Portada con hero animado, ingresos nuevos, selección, marcas, promociones,
  ranking, testimonios y preguntas frecuentes.
- Catálogo con filtros por marca, talle, color, colección, precio,
  disponibilidad y ofertas. Todo vive en la URL, así que un filtro se comparte.
- Buscador con `⌘K` / `Ctrl+K` por marca, modelo, nombre, color, material y SKU.
- Ficha de producto con galería y zoom, selector de talle, stock real,
  relacionados y datos estructurados de Schema.org.
- Carrito persistente, favoritos y "vistos recientemente" (todo en el navegador,
  sin cuenta).
- Página propia por marca en `/marca/nike`, `/marca/adidas`, etc.

**Panel**

- Resumen con pedidos por día, ventas por marca, más vistos y stock bajo.
- Productos: alta, edición, duplicado, borrado, varias imágenes con orden,
  descuentos, etiquetas, colecciones y SKU.
- Stock por talle. **Cuando un talle llega a cero desaparece del sitio solo.**
- Pedidos con estados (pendiente → contactado → finalizado → cancelado). Marcar
  un pedido como finalizado descuenta el stock y suma la venta.
- Marcas, categorías, banners y ofertas editables sin tocar código.
- Ajustes: WhatsApp, redes, envío sin cargo, con vista previa del mensaje real.

## El flujo de compra

```
Landing → Catálogo → Filtros → Ficha → Carrito → Finalizar por WhatsApp
```

Al tocar "Finalizar por WhatsApp" el servidor **recalcula los precios desde la
base** (nunca confía en el navegador), registra el pedido en el panel y devuelve
el link de `wa.me` con el mensaje armado:

```
Hola, quiero comprar:

• Nike Air Max 95
Talle 42
Cantidad 1
Precio $ 289.000

• Adidas Campus 00s
Talle 41
Cantidad 2
Precio $ 438.000

Total: $ 727.000
```

## Imágenes del catálogo

Los 32 modelos vienen con ilustraciones vectoriales generadas por
`scripts/generate-images.mjs` — son **placeholders de relleno, no fotos reales**.
Subí las fotos verdaderas desde el panel (Productos → editar → Imágenes) y
reemplazan a las generadas. Para regenerarlas o cambiar las colorways:

```bash
npm run gen:images
```

## Paleta

Los dos colores salen del logo. No hay un tercero.

| Token | Hex | Para qué |
| --- | --- | --- |
| `ink` | `#302F2B` | Fondo del sitio — el carbón del logo |
| `graphite` | `#26251F` | Pozos de imagen, más profundo que el fondo |
| `slate` | `#3A3934` | Superficies elevadas |
| `ash` | `#9A9689` | Microcopy, datos secundarios |
| `mist` | `#B4B0A0` | Texto de cuerpo |
| `chalk` | `#F2EFDD` | Títulos |
| `cream` | `#F7F4E0` | El crema exacto del logo — acento y botón principal |
| `sand` | `#D9D3B6` | Acentos que no gritan |
| `glow` | `#C9BE93` | La luz cálida difuminada del fondo |

Verde, ámbar y rojo aparecen sólo en estados (finalizado, stock bajo, agotado) y
van desaturados para no romper la temperatura.

El lockup de marca es una reconstrucción tipográfica. **Si tenés el logo
vectorizado**, guardalo en `public/logo.svg` y seguí la instrucción que está
comentada arriba de `Logo` en [`src/components/site/logo.tsx`](src/components/site/logo.tsx).

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Radix UI
(estilo shadcn) · Lucide · Recharts · Zod

## Dónde se guardan los datos

Lo decide `DATA_DRIVER`:

| | `local` (default) | `supabase` |
| --- | --- | --- |
| Datos | `.data/db.json` | Postgres |
| Fotos | `/public/uploads` | Supabase Storage |
| Sirve para | desarrollo, VPS | **Netlify**, Vercel, cualquier serverless |

El mismo código corre contra los dos: la persistencia está detrás de un contrato
(`src/lib/data/repo.ts`) con una implementación por driver.

## Publicar

El sitio se despliega en **Netlify + Supabase**. La guía paso a paso está en
[`docs/DEPLOY-NETLIFY.md`](docs/DEPLOY-NETLIFY.md): crear el proyecto, correr
[`supabase/schema.sql`](supabase/schema.sql), migrar tu catálogo con
`npm run seed:supabase`, y conectar el repo.

En Netlify el filesystem de las funciones es de sólo lectura, así que ahí
`DATA_DRIVER=local` **no funciona** — el `netlify.toml` ya fuerza `supabase`.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run typecheck     # tsc --noEmit
npm run gen:images    # regenerar las imágenes del catálogo
npm run seed:supabase # subir el catálogo actual a Supabase
```
