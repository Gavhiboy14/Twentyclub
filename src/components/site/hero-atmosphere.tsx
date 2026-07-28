/**
 * Atmósfera del hero: lo que hace que el negro no se lea como un fondo plano.
 *
 * Son cuatro capas, todas por debajo del contenido y ninguna interactiva:
 * dos haces de luz volumétrica, un velo de gradientes radiales, polvo en
 * suspensión y una viñeta que cierra los bordes. Todo con CSS — sin canvas
 * ni un solo `requestAnimationFrame`, porque esto vive en el LCP de la home.
 */

/** PRNG determinista. Sin esto el servidor y el cliente sortean motas
 *  distintas y React tira un error de hidratación en la primera pintura. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(2026);

/** 24 motas alcanzan: por encima se lee como nieve y no como polvo. */
const DUST = Array.from({ length: 24 }, () => {
  const size = 1 + random() * 2.2;
  return {
    left: 4 + random() * 92,
    top: 12 + random() * 78,
    size,
    // Las motas grandes están "más cerca": brillan más y viajan más rápido.
    peak: 0.18 + (size / 3.2) * 0.42,
    duration: 16 + random() * 16,
    delay: -random() * 30,
    driftX: -26 + random() * 52,
  };
});

export function HeroAtmosphere() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* Haces volumétricos. Inclinados y muy difusos: se leen como luz que
          entra por un costado, no como dos formas dibujadas. */}
      <div className="absolute -top-1/4 left-[6%] h-[150%] w-[22rem] -rotate-[14deg] bg-linear-to-b from-champagne/[0.055] via-champagne/[0.015] to-transparent blur-3xl" />
      <div className="absolute -top-1/3 right-[14%] h-[150%] w-[30rem] rotate-[10deg] bg-linear-to-b from-champagne/[0.04] to-transparent blur-[90px]" />

      {/* Gradientes radiales de base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 68% 42%, rgba(201,160,99,0.09), transparent 68%)," +
            "radial-gradient(50% 45% at 8% 12%, rgba(232,220,196,0.05), transparent 70%)",
        }}
      />

      {/* Polvo en suspensión */}
      <div className="absolute inset-0 overflow-hidden">
        {DUST.map((mote, i) => (
          <span
            key={i}
            className="animate-dust absolute rounded-full bg-champagne"
            style={
              {
                left: `${mote.left}%`,
                top: `${mote.top}%`,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                animationDuration: `${mote.duration}s`,
                animationDelay: `${mote.delay}s`,
                "--dust-peak": mote.peak,
                "--dust-x": `${mote.driftX}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Viñeta: hunde las esquinas y empuja la mirada al centro derecha */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 42%, rgba(15,15,16,0.55) 78%, var(--color-ink) 100%)",
        }}
      />

      {/* Corte inferior: el hero se funde con la banda de estadísticas */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-ink to-transparent" />
    </div>
  );
}
