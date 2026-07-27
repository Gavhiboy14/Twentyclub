"use client";

import { useState } from "react";
import { useCart } from "@/store/cart";

interface CheckoutCustomer {
  name?: string;
  phone?: string;
  note?: string;
}

/**
 * Registra el pedido en el panel y redirige a WhatsApp con el resumen.
 * El link lo arma el servidor para que el número y los precios salgan siempre
 * de la base, nunca del navegador.
 */
export function useCheckout() {
  const { items, clear } = useCart();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout(customer?: CheckoutCustomer) {
    if (items.length === 0 || sending) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            qty: i.qty,
          })),
          customer,
        }),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "No pudimos armar el pedido. Probá de nuevo.");
        return;
      }

      clear();
      window.location.assign(data.url);
    } catch {
      setError("Sin conexión. Revisá internet y volvé a intentar.");
    } finally {
      setSending(false);
    }
  }

  return { checkout, sending, error } as const;
}
