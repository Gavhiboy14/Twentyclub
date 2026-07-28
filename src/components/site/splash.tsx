"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkle } from "./logo";

/** Piso: nunca menos que esto en pantalla, para que una carga ya cacheada no
 *  se sienta como un parpadeo. */
const MIN_DISPLAY_MS = 650;
/**
 * Techo: pase lo que pase con `load`, a los 4s el splash se va igual.
 *
 * `load` espera a TODO —hasta un recurso invisible de baja prioridad, como
 * un pixel de tracking— así que en una conexión mala puede tardar bastante
 * más que el contenido visible, que carga con prioridad y normalmente ya
 * está listo mucho antes. Probado a propósito: con un recurso que tarda 8s,
 * el techo corta el splash a los 4s y lo que queda debajo ya es la página
 * completa, no una a medio cargar. Ese es el balance: nunca tapa el sitio
 * más de 4s, y en la inmensa mayoría de los casos para entonces no hay nada
 * roto que revelar.
 */
const HARD_TIMEOUT_MS = 4000;

/**
 * Pantalla de bienvenida de la primera visita: las dos chispas del logo,
 * agrandadas.
 *
 * Vive en el layout raíz (`app/layout.tsx`) y en ningún otro lado, porque es
 * el único punto del árbol sin un `await` propio. `(site)/layout.tsx` trae
 * marcas y ajustes antes de renderizar nada; si el splash viviera ahí abajo,
 * se perdería justo la espera que tiene que tapar.
 *
 * Entrada y giro son CSS puro —clases que ya vienen en el HTML que manda el
 * servidor— y por eso se ven aunque React todavía no haya hidratado. La
 * salida es lo único que necesita JavaScript: tiene que saber cuándo la
 * página terminó de cargar de verdad, y eso lo da el evento `load` del
 * navegador. Con streaming de Next, `load` no dispara hasta que el HTML
 * final —el reemplazo del contenido, no sólo el cascarón— ya llegó y sus
 * recursos cargaron, así que es una señal real y no un timer inventado.
 */
export function Splash() {
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    const start = performance.now();
    let dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      const elapsed = performance.now() - start;
      window.setTimeout(
        () => setVisible(false),
        Math.max(0, MIN_DISPLAY_MS - elapsed),
      );
    }

    if (document.readyState === "complete") {
      dismiss();
    } else {
      window.addEventListener("load", dismiss, { once: true });
    }

    const hardCap = window.setTimeout(dismiss, HARD_TIMEOUT_MS);
    return () => {
      window.removeEventListener("load", dismiss);
      window.clearTimeout(hardCap);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-label="Cargando Twenty Club"
          className="fixed inset-0 z-[100] grid place-items-center bg-ink"
          initial={false}
          exit={{ opacity: 0, filter: reduced ? "none" : "blur(18px)" }}
          transition={{
            duration: reduced ? 0.2 : 0.65,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {/* Entrada: opacidad + blur + escala. Nunca rotación acá — eso es
              del elemento de adentro, para no pisarle el transform. */}
          <span className="animate-sparkle-enter">
            <span className="relative block size-14 animate-sparkle-spin">
              <Sparkle className="size-14 text-chalk" />
              <Sparkle className="absolute -bottom-1 -right-1 size-4 text-champagne/70" />
            </span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
