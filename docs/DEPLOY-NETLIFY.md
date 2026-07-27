# Publicar en Netlify

Netlify corre las funciones en serverless: el filesystem es **de sólo lectura**.
Por eso en producción el catálogo, los pedidos y las fotos viven en Supabase, y
no en `.data/db.json` ni en `/public/uploads`.

El código ya soporta las dos cosas. Lo elige `DATA_DRIVER`:

| | `local` | `supabase` |
| --- | --- | --- |
| Datos | `.data/db.json` | Postgres |
| Fotos | `/public/uploads` | Supabase Storage |
| Sirve para | desarrollo, VPS | **Netlify**, Vercel, cualquier serverless |

---

## 1. Crear el proyecto en Supabase

En [supabase.com](https://supabase.com) → **New project**. Elegí la región más
cercana a tus clientes (para Argentina, `sa-east-1` São Paulo).

Cuando termine, andá a **Project Settings → API Keys** y anotá:

- **Project URL** (pestaña *API*) → `NEXT_PUBLIC_SUPABASE_URL`
- **Secret key** (`sb_secret_…`) → `SUPABASE_SECRET_KEY`

> La clave secreta saltea todas las reglas de seguridad de la base. Nunca la
> pongas con prefijo `NEXT_PUBLIC_`, nunca la subas al repo, nunca la pegues en
> el navegador. Va sólo en variables de entorno del servidor.

Si tu proyecto todavía muestra las claves viejas (`anon` / `service_role` en la
pestaña **Legacy API Keys**), usá `service_role` y guardala como
`SUPABASE_SERVICE_ROLE_KEY`. El código acepta las dos.

La clave **publicable** no hace falta: el sitio no habla con Supabase desde el
navegador, todo pasa por el servidor.

## 2. Crear las tablas

En Supabase → **SQL Editor** → **New query**. Pegá el contenido completo de
[`supabase/schema.sql`](../supabase/schema.sql) y dale **Run**.

Eso crea las siete tablas, las reglas de RLS (catálogo público de lectura;
pedidos y ajustes sólo desde el servidor), la función que descuenta stock de
forma atómica, y el bucket `productos` de Storage.

## 3. Cargar tu catálogo

En `.env.local` completá las dos claves y **dejá `DATA_DRIVER=local`** por ahora:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
DATA_DRIVER=local
```

Después:

```bash
npm run seed:supabase
```

El script lee tu `.data/db.json` **actual** — o sea, con todos los productos que
ya cargaste desde el panel, no el catálogo de fábrica —, sube las imágenes de
`/public/products`, `/public/brands` y `/public/uploads` al bucket, reescribe
las rutas a las URLs públicas de Storage y hace upsert de todo.

Es idempotente: podés correrlo de nuevo sin duplicar nada. Con `-- --force`
borra todo antes de cargar.

## 4. Probar Supabase en local

Cambiá una línea de `.env.local`:

```bash
DATA_DRIVER=supabase
```

```bash
npm run dev
```

Recorré la tienda y el panel. Cargá un producto, subí una foto, cambiá un
banner, hacé un pedido de prueba. Si algo falla acá, va a fallar igual en
Netlify — es el mismo camino de código.

Cuando termines, borrá el pedido de prueba desde **Pedidos** en el panel.

### De acá en adelante, cargá el catálogo con `DATA_DRIVER=supabase`

Esta migración es **una sola vez**, para subir lo que ya tenías. Para todo lo
que cargues después —productos nuevos, fotos reales, banners— dejá
`DATA_DRIVER=supabase` en tu `.env.local` y trabajá desde ahí, aunque estés en
`localhost`.

La razón: con `DATA_DRIVER=local`, todo lo que subís por el panel (fotos a
`/public/uploads`, productos a `.data/db.json`) queda **sólo en tu disco** — las
dos carpetas están en `.gitignore` a propósito, para no versionar datos de
prueba ni binarios. Nunca llegan a Git, y Netlify ni se entera: en producción
lee de Supabase, no de esos archivos. Si volvés a `local`, subís fotos, y
hacés deploy, el producto directamente **no aparece** en el sitio publicado —
no es un problema de la imagen sola, falta el producto entero.

En cambio, con `DATA_DRIVER=supabase` local, el panel en tu máquina escribe
directo en la misma base y el mismo bucket que usa el sitio en vivo. No hay
paso de sincronización: lo que cargás en `localhost:3000/admin` aparece en
Netlify sin tocar nada más.

`local` te sigue sirviendo para prototipar sin conexión o tocar la UI sin
miedo a romper datos reales — pero para catálogo real, es `supabase` siempre.

## 5. Subir el repo

```bash
cd "C:\Users\Gxbxe\Claude Code\twenty-club"
git init
git add .
git commit -m "Twenty Club"
```

`.gitignore` ya excluye `.env.local`, `.data/` y `/public/uploads`. Verificá
antes de pushear que no aparezca ninguna clave:

```bash
git grep -i "service_role\|eyJ" -- ':!package-lock.json'
```

Creá el repo en GitHub y subilo.

## 6. Conectar Netlify

**Add new site → Import an existing project → GitHub** y elegí el repo.

Netlify detecta Next.js solo e instala su runtime. El `netlify.toml` del repo ya
fija el comando de build, la versión de Node y las cabeceras de seguridad — no
toques nada en la pantalla de configuración.

## 7. Cargar las variables de entorno

**Site configuration → Environment variables**. Estas siete:

| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | La de Supabase |
| `SUPABASE_SECRET_KEY` | La de Supabase — marcala como **secret** |
| `NEXT_PUBLIC_SITE_URL` | Tu dominio final, ej. `https://twentyclub.com.ar` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `5491123389725` |
| `ADMIN_EMAIL` | Tu email de administrador |
| `ADMIN_PASSWORD` | Una contraseña larga, distinta a la de desarrollo |
| `AUTH_SECRET` | Una cadena aleatoria nueva (ver abajo) |

`DATA_DRIVER=supabase` ya viene del `netlify.toml`, no hace falta cargarla.

Para generar el `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Cambiá `AUTH_SECRET` y `ADMIN_PASSWORD` antes del primer deploy.** Los
> valores de `.env.example` están en el repo: si los dejás, cualquiera que vea
> el código entra al panel.

## 8. Deploy

**Deploy site**. El primer build tarda unos minutos.

Cuando termine, revisá:

- [ ] La portada carga con las fotos desde Supabase Storage
- [ ] `/productos` filtra por talle y marca
- [ ] Una ficha de producto muestra los talles reales
- [ ] `/admin` te pide login y entra con tus credenciales nuevas
- [ ] Podés subir una foto desde el panel y se ve en la tienda
- [ ] Un pedido de prueba abre WhatsApp y queda registrado en **Pedidos**
- [ ] Marcarlo como finalizado descuenta el stock

## 9. Dominio propio

**Domain management → Add a domain**. Netlify emite el certificado HTTPS solo.

Cuando el dominio esté activo, actualizá `NEXT_PUBLIC_SITE_URL` a la URL
definitiva y redesplegá — de ahí salen el sitemap, las etiquetas Open Graph y
los datos estructurados de Schema.org.

---

## Cosas que conviene saber

**Los backups.** Supabase hace backups diarios automáticos en los planes pagos.
En el plan gratuito no: si vas en serio, exportá la base cada tanto desde
**Database → Backups**, o pasá al plan Pro.

**El límite del snapshot.** Cada request trae el catálogo completo de la base y
filtra en memoria. Con decenas o cientos de productos es más rápido y más simple
que armar una query por vista. Si algún día pasás las ~500 fichas, el método a
cambiar es `snapshot()` en `src/lib/data/drivers/supabase.ts`; el resto del
código no se entera.

**Las imágenes de catálogo son placeholders.** Los SVG generados se suben a
Storage junto con todo lo demás. Reemplazalos por fotos reales desde el panel a
medida que las tengas.

**`local` y `supabase` no comparten datos.** Son dos bases completamente
separadas. Volver a `DATA_DRIVER=local` en cualquier momento hace que el sitio
funcione otra vez contra `.data/db.json`, sin tocar código — sirve para probar
la UI rápido sin conexión — pero nada de lo que cargues ahí va a aparecer en
Netlify hasta que corras `npm run seed:supabase` de nuevo. Para catálogo real,
trabajá siempre con `supabase` (ver el aviso en el paso 4).
