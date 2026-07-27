import type { OrderStatus } from "@/lib/types";
import type { BadgeProps } from "@/components/ui/badge";

/**
 * Estados de un pedido. Es el único lugar del sitio donde entra color fuerte,
 * y entra porque significa algo: verde cerrado, ámbar esperando, rojo caído.
 */
export const STATUS_META: Record<
  OrderStatus,
  { label: string; variant: NonNullable<BadgeProps["variant"]>; help: string }
> = {
  pendiente: {
    label: "Pendiente",
    variant: "warn",
    help: "Llegó el pedido y todavía no hablaste con el cliente.",
  },
  contactado: {
    label: "Contactado",
    variant: "cream",
    help: "Ya hay conversación abierta por WhatsApp.",
  },
  finalizado: {
    label: "Finalizado",
    variant: "ok",
    help: "Cobrado y despachado. Descuenta stock automáticamente.",
  },
  cancelado: {
    label: "Cancelado",
    variant: "bad",
    help: "No se concretó. No afecta el stock.",
  },
};

export const STATUS_ORDER: OrderStatus[] = [
  "pendiente",
  "contactado",
  "finalizado",
  "cancelado",
];
