import type { Metadata } from "next";
import { Clock, Mail, MapPin } from "lucide-react";
import { getSettings } from "@/lib/data/queries";
import { Reveal, RevealWords } from "@/components/motion/reveal";
import { Faq } from "@/components/site/faq";
import { Button } from "@/components/ui/button";
import {
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/site/social-icons";
import { normalizePhone } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escribinos por WhatsApp para consultar talles, coordinar showroom o pedir un modelo que no está en el catálogo.",
  alternates: { canonical: "/contacto" },
};

const PASOS = [
  {
    title: "Elegís tu par",
    body: "Filtrás por talle y sólo ves lo que existe en stock. Si no aparece tu talle, es porque no lo tenemos.",
  },
  {
    title: "Agregás al carrito",
    body: "Podés sumar varios modelos y talles distintos. El carrito se guarda aunque cierres la pestaña.",
  },
  {
    title: "Cerrás por WhatsApp",
    body: "El botón abre el chat con el pedido ya escrito: modelos, talles, cantidades y total. No hace falta que copies nada.",
  },
  {
    title: "Coordinamos y despachamos",
    body: "Confirmamos stock, acordamos el pago y el envío. CABA y GBA en 24 a 48 horas.",
  },
];

export default async function ContactPage() {
  const settings = await getSettings();
  const wa = `https://wa.me/${normalizePhone(settings.whatsappNumber)}`;

  return (
    <div className="mx-auto max-w-[86rem] px-5 py-20 sm:px-8 lg:py-28">
      <Reveal className="mb-16 max-w-2xl">
        <p className="eyebrow mb-4">Contacto</p>
        <h1 className="display-xl text-[clamp(2.25rem,6.5vw,4.5rem)] text-chalk">
          <RevealWords text="Del otro lado hay una persona." />
        </h1>
        <p className="mt-6 text-base leading-relaxed text-mist">
          No usamos bots. Escribinos por WhatsApp para consultar un talle,
          coordinar showroom o pedir un modelo que no esté en el catálogo.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-[1.15em]" />
              Escribir por WhatsApp
            </a>
          </Button>
          <Button asChild variant="glass" size="lg">
            <a href={`mailto:${settings.email}`}>
              <Mail />
              Mandar un mail
            </a>
          </Button>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        <InfoCard icon={<MapPin className="size-4" />} title="Showroom">
          {settings.address}. Con turno previo por WhatsApp.
        </InfoCard>
        <InfoCard icon={<Clock className="size-4" />} title="Horario">
          Lunes a sábado, de 10 a 20 h. Los mensajes se responden el mismo día.
        </InfoCard>
        <InfoCard icon={<Mail className="size-4" />} title="Mail">
          <a
            href={`mailto:${settings.email}`}
            className="transition-colors hover:text-chalk"
          >
            {settings.email}
          </a>
        </InfoCard>
        <InfoCard icon={<InstagramIcon className="size-4" />} title="Redes">
          <span className="flex flex-wrap items-center gap-3">
            <a
              href={`https://instagram.com/${settings.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-chalk"
            >
              @{settings.instagram}
            </a>
            <a
              href={`https://tiktok.com/@${settings.tiktok}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-chalk"
            >
              <TikTokIcon className="size-3" />
              TikTok
            </a>
          </span>
        </InfoCard>
      </div>

      {/* Cómo comprar */}
      <section id="como-comprar" className="mt-32 scroll-mt-28">
        <Reveal className="mb-10">
          <p className="eyebrow mb-4">Cómo comprar</p>
          <h2 className="display-xl text-[clamp(1.85rem,4.5vw,3rem)] text-chalk">
            Cuatro pasos, sin cuenta ni tarjeta
          </h2>
        </Reveal>

        {/* La numeración va porque es una secuencia real: el orden importa. */}
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, i) => (
            <Reveal key={paso.title} delay={i * 0.08}>
              <li className="h-full rounded-[1.75rem] border border-champagne/[0.07] bg-graphite/50 backdrop-blur-xl p-8">
                <span className="numeric text-sm tracking-[0.18em] text-chalk">
                  0{i + 1}
                </span>
                <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-chalk">
                  {paso.title}
                </h3>
                <p className="mt-3 text-[0.8125rem] leading-[1.7] text-ash">
                  {paso.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="envios" className="mt-24 scroll-mt-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className="eyebrow mb-4">Preguntas frecuentes</p>
            <h2 className="display-xl text-[clamp(1.85rem,4.5vw,3rem)] text-chalk">
              Envíos, cambios y todo lo demás
            </h2>
            <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-ash">
              Si tu duda no está acá, mandala por WhatsApp y la contestamos.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="scroll-mt-28" >
            <div id="cambios">
              <Faq />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-champagne/[0.07] bg-graphite/50 backdrop-blur-xl p-8">
      <span className="text-chalk">{icon}</span>
      <h2 className="eyebrow mt-4">{title}</h2>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-mist">
        {children}
      </p>
    </div>
  );
}
