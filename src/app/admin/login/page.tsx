import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { SiteBackground } from "@/components/site/site-background";
import { Logo } from "@/components/site/logo";

export const metadata: Metadata = {
  title: "Ingresar al panel",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <>
      <SiteBackground />
      <div className="grid min-h-dvh place-items-center px-5 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex justify-center">
            <Logo />
          </div>

          <div className="glass-strong edge-light grain rounded-[1.75rem] p-8">
            <p className="eyebrow mb-3">Panel administrador</p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-cream">
              Ingresá para administrar
            </h1>
            <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ash">
              Desde acá se cargan productos, stock, banners y pedidos.
            </p>

            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-xs text-ash">
            Las credenciales se configuran en las variables{" "}
            <code className="numeric text-mist">ADMIN_EMAIL</code> y{" "}
            <code className="numeric text-mist">ADMIN_PASSWORD</code>.
          </p>
        </div>
      </div>
    </>
  );
}
