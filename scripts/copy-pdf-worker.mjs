/**
 * Copia el worker de pdf.js a /public.
 *
 * La lectura del PDF pasa en el navegador y pdf.js necesita su worker servido
 * como archivo suelto. Empaquetarlo con webpack es frágil entre versiones, así
 * que se copia tal cual y se referencia por ruta.
 *
 * Corre solo antes de `dev` y de `build`. El archivo copiado está en
 * .gitignore: sale de node_modules y se regenera en cada instalación, así que
 * versionarlo sería arrastrar un megabyte duplicado.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);

const source = resolve(
  dirname(require.resolve("pdfjs-dist/package.json")),
  "build/pdf.worker.min.mjs",
);
const target = resolve(process.cwd(), "public/pdf.worker.min.mjs");

await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);

console.log("pdf.js worker → public/pdf.worker.min.mjs");
