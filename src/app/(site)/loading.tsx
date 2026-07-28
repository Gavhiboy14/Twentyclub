/**
 * El `<Splash />` del layout raíz cubre toda la pantalla mientras carga, así
 * que este fallback no necesita mostrar nada — sigue existiendo sólo para que
 * Next tenga un límite de Suspense alrededor de la página y el resto del
 * árbol pueda transmitirse en paralelo.
 */
export default function Loading() {
  return null;
}
