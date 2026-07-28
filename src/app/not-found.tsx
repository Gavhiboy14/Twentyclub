import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteBackground } from "@/components/site/site-background";

export default function NotFound() {
  return (
    <>
      <SiteBackground />
      <div className="grid min-h-dvh place-items-center px-5">
        <div className="text-center">
          <p className="eyebrow mb-8">Error 404</p>
          <p className="display-xl text-[clamp(5rem,20vw,12rem)] leading-none text-transparent">
            <span className="bg-linear-to-b from-champagne/[0.22] to-champagne/[0.02] bg-clip-text">
              404
            </span>
          </p>
          <h1 className="display-xl mt-4 text-[clamp(1.75rem,5vw,2.75rem)] text-chalk">
            Esta página no existe
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-ash">
            Puede que el par se haya agotado o que el link esté viejo. Probá
            desde la colección.
          </p>
          <div className="mt-11 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/productos">Ver colección</Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
