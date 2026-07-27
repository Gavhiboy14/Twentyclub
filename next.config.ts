import type { NextConfig } from "next";

/**
 * Sólo se permiten imágenes del propio proyecto de Supabase. Dejar el host
 * abierto convierte al optimizador de Next en un proxy de imágenes gratis para
 * cualquiera que arme una URL.
 */
function imageHosts() {
  const hosts: string[] = [];

  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabase) {
    try {
      hosts.push(new URL(supabase).hostname);
    } catch {
      // URL mal formada: se ignora y queda sin hosts remotos.
    }
  }

  // Hosts extra separados por coma, por si servís las fotos desde otro lado.
  const extra = process.env.NEXT_PUBLIC_IMAGE_HOSTS;
  if (extra) hosts.push(...extra.split(",").map((h) => h.trim()).filter(Boolean));

  return hosts;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageHosts().map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
