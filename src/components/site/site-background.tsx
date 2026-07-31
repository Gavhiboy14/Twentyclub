/**
 * Atmósfera del sitio: negro profundo con dos focos champagne casi imperceptibles.
 *
 * La opacidad es deliberadamente baja (0.05–0.09). A partir de ahí la luz se
 * lee como un color más de la paleta en vez de como iluminación, y el negro
 * deja de sentirse profundo.
 */
export function SiteBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink"
    >
      <div
        className="bloom animate-drift left-[-15%] top-[-25%] size-[52rem] opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(239,233,213,0.09), rgba(201,185,151,0.03) 50%, transparent 72%)",
        }}
      />
      <div
        className="bloom animate-drift right-[-18%] top-[35%] size-[44rem] opacity-55 [animation-delay:-12s]"
        style={{
          background:
            "radial-gradient(circle, rgba(201,185,151,0.07), transparent 68%)",
        }}
      />

      {/* Malla amplia. Da estructura sin dibujar: a 120px se percibe como
          textura del material, no como una grilla. */}
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #e8dcc4 1px, transparent 1px), linear-gradient(to bottom, #e8dcc4 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 35%, #000 25%, transparent 75%)",
        }}
      />

      {/* Viñeta inferior: asienta el footer y evita que el negro se vea plano */}
      <div className="absolute inset-x-0 bottom-0 h-[28rem] bg-linear-to-t from-ink via-ink/80 to-transparent" />
    </div>
  );
}
