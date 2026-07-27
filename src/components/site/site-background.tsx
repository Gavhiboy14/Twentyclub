/**
 * Atmósfera del sitio: tres focos cálidos muy difuminados sobre carbón, con una
 * malla fina encima. Va fijo detrás de todo y no se scrollea — es lo que da la
 * sensación de profundidad sin cargar ninguna imagen.
 *
 * La luz es del mismo crema del logo, bajada a un 20–30% de opacidad: se lee
 * como iluminación de vidriera, no como un color más de la paleta.
 */
export function SiteBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink"
    >
      <div
        className="bloom animate-drift left-[-12%] top-[-18%] size-[46rem] opacity-45"
        style={{
          background:
            "radial-gradient(circle, rgba(247,244,224,0.22), rgba(201,190,147,0.07) 55%, transparent 70%)",
        }}
      />
      <div
        className="bloom animate-drift right-[-16%] top-[22%] size-[38rem] opacity-35 [animation-delay:-8s]"
        style={{
          background:
            "radial-gradient(circle, rgba(201,190,147,0.24), rgba(201,190,147,0.06) 55%, transparent 70%)",
        }}
      />
      <div
        className="bloom animate-drift bottom-[-20%] left-[35%] size-[42rem] opacity-30 [animation-delay:-15s]"
        style={{
          background:
            "radial-gradient(circle, rgba(217,211,182,0.2), transparent 68%)",
        }}
      />

      {/* Malla de 88px — se lee como estructura, no como decoración */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f7f4e0 1px, transparent 1px), linear-gradient(to bottom, #f7f4e0 1px, transparent 1px)",
          backgroundSize: "88px 88px",
          maskImage:
            "radial-gradient(ellipse 85% 65% at 50% 40%, #000 30%, transparent 78%)",
        }}
      />

      {/* Viñeta inferior para asentar el footer */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-linear-to-t from-ink via-ink/70 to-transparent" />
    </div>
  );
}
