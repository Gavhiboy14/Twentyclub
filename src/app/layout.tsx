import type { Metadata, Viewport } from "next";
import { Inter_Tight, Manrope } from "next/font/google";
import "./globals.css";

/**
 * Dos familias y nada más. Inter Tight para titulares — es la grotesca más
 * cerrada del catálogo y aguanta el tracking negativo fuerte que pide un
 * título de 6rem sin desarmarse. Manrope para leer.
 */
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Twenty Club — Zapatillas originales",
    template: "%s · Twenty Club",
  },
  description:
    "Zapatillas originales de Nike, Adidas, New Balance, Jordan y seis marcas más. Curadas de a una, con talles reales y envío a todo el país.",
  applicationName: "Twenty Club",
  keywords: [
    "zapatillas",
    "sneakers",
    "Nike",
    "Adidas",
    "New Balance",
    "Jordan",
    "Puma",
    "Argentina",
  ],
  authors: [{ name: "Twenty Club" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: siteUrl,
    siteName: "Twenty Club",
    title: "Twenty Club — Tu próximo par empieza acá",
    description:
      "Zapatillas originales de nueve marcas. Elegís, agregás al carrito y cerrás el pedido por WhatsApp.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Twenty Club — Tu próximo par empieza acá",
    description: "Zapatillas originales de nueve marcas, curadas de a una.",
  },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = {
  themeColor: "#0f0f10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${interTight.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
