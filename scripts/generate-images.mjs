/**
 * Genera las imágenes de catálogo como SVG vectoriales en /public/products.
 *
 * Son placeholders de alta calidad: silueta de zapatilla dibujada a mano en
 * paths, con la colorway de cada producto. Se reemplazan subiendo fotos reales
 * desde el panel (/admin/productos) — el sitio no depende de ellas.
 *
 *   node scripts/generate-images.mjs
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/products");

/* -------------------------------------------------------------------------- */
/* Siluetas                                                                    */
/* -------------------------------------------------------------------------- */

/*
 * Perfil lateral, mirando a la derecha. Espacio local 720×420, piso en y=344.
 * Referencias: talón x≈92, punta x≈634, boca del cuello y≈170, caña y≈150.
 */

/*
 * El borde superior del corte desciende de forma monótona desde la caña hasta
 * la punta — es lo que separa una zapatilla de un bulto.
 */

/** Unidad de suela completa: cuña de talón alta, punta fina. */
const SOLE =
  "M104 258 C94 230, 108 214, 138 212 L470 242 " +
  "C545 256, 596 280, 614 302 C618 322, 600 336, 570 338 " +
  "L150 338 C116 336, 98 300, 104 258 Z";

/** Piso: la tajada inferior de la suela, en goma más oscura. */
const OUTSOLE =
  "M100 306 C104 326, 122 337, 152 338 L570 338 " +
  "C600 336, 618 322, 614 302 C440 316, 240 316, 100 306 Z";

const UPPER_LOW =
  "M108 258 C100 218, 106 176, 128 156 C146 141, 176 145, 186 166 " +
  "C194 182, 196 194, 204 202 C222 214, 252 208, 282 202 " +
  "C330 194, 388 200, 448 216 C512 234, 572 264, 610 296 " +
  "C500 288, 280 268, 108 258 Z";

const UPPER_HIGH =
  "M108 258 C96 206, 94 132, 116 100 C136 72, 180 74, 194 104 " +
  "C206 130, 200 172, 204 202 C222 214, 252 208, 282 202 " +
  "C330 194, 388 200, 448 216 C512 234, 572 264, 610 296 " +
  "C500 288, 280 268, 108 258 Z";

/** Boca del cuello: el hueco por donde entra el pie. */
const COLLAR_LOW =
  "M184 168 C202 190, 224 204, 254 208 C276 212, 262 226, 232 220 " +
  "C202 213, 182 194, 184 168 Z";

const COLLAR_HIGH =
  "M124 104 C146 88, 180 92, 192 112 C200 128, 180 134, 158 128 " +
  "C138 122, 124 118, 124 104 Z";

const TONGUE_LOW =
  "M258 206 C264 192, 286 184, 310 188 C324 191, 322 200, 308 208 " +
  "C294 215, 270 214, 258 206 Z";

const TONGUE_HIGH =
  "M214 200 C216 164, 228 126, 244 118 C256 112, 260 140, 256 170 " +
  "C253 188, 240 202, 226 208 Z";

/** Panel lateral. Forma genérica: no reproduce el logo de ninguna marca. */
const SIDE_PANEL =
  "M176 274 C228 266, 290 250, 352 230 C384 220, 404 224, 400 236 " +
  "C396 250, 360 262, 312 272 C258 284, 208 288, 178 288 Z";

/** Panel de ojales, sobre el empeine. */
const EYESTAY =
  "M288 206 C340 198, 396 204, 452 218 C450 230, 444 240, 438 246 " +
  "C384 232, 330 226, 292 226 Z";

const TOE_SEAM = "M496 238 C526 256, 554 276, 572 290";
const HEEL_SEAM = "M156 168 C144 196, 140 226, 144 258";
const FOXING = "M104 300 C250 314, 460 314, 614 302";

/* -------------------------------------------------------------------------- */
/* Dibujo                                                                      */
/* -------------------------------------------------------------------------- */

function shoe({ base, accent, sole, highTop }) {
  const upper = highTop ? UPPER_HIGH : UPPER_LOW;
  const collar = highTop ? COLLAR_HIGH : COLLAR_LOW;
  const tongue = highTop ? TONGUE_HIGH : TONGUE_LOW;

  // Cordones cruzados sobre el empeine, siempre por dentro del corte.
  const laces = [];
  for (let i = 0; i < 5; i++) {
    const x = 296 + i * 32;
    const y = 214 + i * 5;
    laces.push(
      `<path d="M${x} ${y} C${x + 12} ${y + 8}, ${x + 20} ${y + 12}, ${x + 30} ${y + 15}"
         stroke="url(#lace)" stroke-width="5.5" stroke-linecap="round" fill="none" opacity="0.9"/>`,
    );
    laces.push(
      `<circle cx="${x + 32}" cy="${y + 16}" r="3" fill="#24231f" opacity="0.55"/>`,
    );
  }

  return `
  <g transform="translate(150 250)">
    <!-- suela: cuña completa, después el piso de goma encima -->
    <path d="${SOLE}" fill="url(#midGrad)"/>
    <ellipse cx="164" cy="282" rx="40" ry="14" fill="${accent}" opacity="0.35"/>
    <ellipse cx="164" cy="282" rx="40" ry="14" fill="none" stroke="${accent}" stroke-opacity="0.6" stroke-width="1.5"/>
    <path d="${OUTSOLE}" fill="url(#soleGrad)"/>
    <path d="${FOXING}" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="1.8"/>

    <!-- corte -->
    <path d="${upper}" fill="url(#upperGrad)"/>
    <path d="${EYESTAY}" fill="${darken(base, 22)}" opacity="0.85"/>
    <path d="${SIDE_PANEL}" fill="${accent}" opacity="0.92"/>
    <path d="${SIDE_PANEL}" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.5"/>
    <path d="${TOE_SEAM}" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="2.5" stroke-linecap="round"/>
    <path d="${HEEL_SEAM}" fill="none" stroke="#000" stroke-opacity="0.26" stroke-width="2.5" stroke-linecap="round"/>

    <!-- lengüeta y boca del cuello -->
    <path d="${tongue}" fill="url(#collarGrad)"/>
    <path d="${collar}" fill="#000" fill-opacity="0.5"/>
    ${laces.join("\n    ")}

    <!-- tirador del talón -->
    <rect x="${highTop ? 122 : 132}" y="${highTop ? 88 : 148}" width="24" height="8" rx="4"
          fill="${accent}" opacity="0.7"/>

    <!-- brillo del corte -->
    <path d="${upper}" fill="url(#sheen)" opacity="0.5"/>
    <path d="${upper}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="1.5"/>
  </g>`;
}

function svg({ base, accent, sole, highTop, view, seed }) {
  const rotate = view === 1 ? -4 : view === 2 ? -2 : 0;
  const mirror = view === 1 ? "scale(-1 1) translate(-1000 0)" : "";
  // Vista 3: acercamiento al panel lateral y la entresuela.
  const zoom = view === 2 ? "translate(-260 -300) scale(1.75)" : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" role="img">
  <defs>
    <!-- Fondo casi plano: el borde de la imagen tiene que fundirse con la
         página y con el pozo de la tarjeta, sin dibujar ningún círculo. -->
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#17161a"/>
      <stop offset="0.6" stop-color="#121114"/>
      <stop offset="1" stop-color="#0f0f10"/>
    </linearGradient>
    <linearGradient id="upperGrad" x1="0.1" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${lighten(base, 26)}"/>
      <stop offset="0.5" stop-color="${base}"/>
      <stop offset="1" stop-color="${darken(base, 34)}"/>
    </linearGradient>
    <linearGradient id="midGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${lighten(sole, 18)}"/>
      <stop offset="1" stop-color="${darken(sole, 22)}"/>
    </linearGradient>
    <linearGradient id="soleGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${darken(sole, 30)}"/>
      <stop offset="1" stop-color="${darken(sole, 62)}"/>
    </linearGradient>
    <linearGradient id="collarGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${darken(base, 18)}"/>
      <stop offset="1" stop-color="${darken(base, 52)}"/>
    </linearGradient>
    <linearGradient id="lace" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${lighten(sole, 30)}"/>
      <stop offset="1" stop-color="${sole}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0.02"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.18"/>
    </linearGradient>
    <filter id="contact" x="-30%" y="-200%" width="160%" height="500%">
      <feGaussianBlur stdDeviation="11"/>
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${seed}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>

  <rect width="1000" height="1000" fill="url(#bg)"/>
  <!-- Sombra de contacto: pegada a la suela y achatada, para que se lea
       como apoyo en el piso y no como un halo redondo. -->
  <ellipse cx="508" cy="598" rx="215" ry="13" fill="#000" opacity="0.5" filter="url(#contact)"/>

  <g transform="${zoom}">
    <g transform="${mirror}">
      <g transform="rotate(${rotate} 500 500)">
        ${shoe({ base, accent, sole, highTop })}
      </g>
    </g>
  </g>

  <rect width="1000" height="1000" filter="url(#grain)" opacity="0.045" style="mix-blend-mode:overlay"/>
</svg>`;
}

/* -------------------------------------------------------------------------- */
/* Utilidades de color                                                         */
/* -------------------------------------------------------------------------- */

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function lighten(hex, amount) {
  return toHex(hexToRgb(hex).map((v) => v + amount));
}

function darken(hex, amount) {
  return toHex(hexToRgb(hex).map((v) => v - amount));
}

/* -------------------------------------------------------------------------- */
/* Banners de marca / portadas de categoría                                    */
/* -------------------------------------------------------------------------- */

/**
 * Los banners van sobre el fondo oscuro del sitio, así que se quedan en negro
 * — al revés que las fotos de producto, que viven sobre la placa marfil.
 */
function bannerSvg(label, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 700" width="1600" height="700" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a1a1c"/>
      <stop offset="1" stop-color="#0f0f10"/>
    </linearGradient>
    <radialGradient id="b1">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="700" fill="url(#bg)"/>
  <circle cx="1180" cy="220" r="420" fill="url(#b1)"/>
  <circle cx="300" cy="620" r="340" fill="url(#b1)" opacity="0.6"/>
  <text x="80" y="420" font-family="'Inter Tight', Inter, Helvetica, sans-serif" font-size="176" font-weight="500"
        letter-spacing="-9" fill="#f2efe8" fill-opacity="0.9">${label}</text>
  <text x="86" y="482" font-family="Manrope, Helvetica, sans-serif" font-size="24" font-weight="500"
        letter-spacing="13" fill="#807d76" fill-opacity="0.85">TWENTY CLUB</text>
</svg>`;
}

/* -------------------------------------------------------------------------- */

async function main() {
  await mkdir(outDir, { recursive: true });
  await mkdir(resolve(root, "public/brands"), { recursive: true });
  await mkdir(resolve(root, "public/uploads"), { recursive: true });

  const manifest = JSON.parse(
    await readFile(resolve(root, "scripts/colorways.json"), "utf8"),
  );

  let count = 0;
  for (const item of manifest.products) {
    for (let view = 0; view < 3; view++) {
      const markup = svg({ ...item, view, seed: count + view });
      await writeFile(resolve(outDir, `${item.slug}-${view + 1}.svg`), markup, "utf8");
      count++;
    }
  }

  for (const b of manifest.banners) {
    await writeFile(
      resolve(root, `public/brands/${b.slug}.svg`),
      bannerSvg(b.label, b.accent),
      "utf8",
    );
  }

  console.log(`✓ ${count} imágenes de producto + ${manifest.banners.length} banners`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
