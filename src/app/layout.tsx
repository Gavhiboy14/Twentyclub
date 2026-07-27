import type { Metadata, Viewport } from "next";
import { Archivo, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-face",
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
  themeColor: "#302f2b",
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
      className={`${archivo.variable} ${manrope.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
