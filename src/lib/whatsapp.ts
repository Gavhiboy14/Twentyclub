import { formatPrice } from "./utils";

export interface WhatsAppLine {
  brand: string;
  name: string;
  size: string;
  qty: number;
  unitPrice: number;
}

export interface WhatsAppOrder {
  items: WhatsAppLine[];
  total: number;
  code?: string;
  customerName?: string;
  note?: string;
}

/**
 * Arma el mensaje que se abre en WhatsApp al finalizar la compra.
 * Se mantiene en texto plano — los emojis y el formato de WhatsApp se rompen
 * distinto en cada cliente, y el pedido tiene que leerse siempre igual.
 */
export function buildOrderMessage(order: WhatsAppOrder): string {
  const lines: string[] = ["Hola, quiero comprar:", ""];

  for (const item of order.items) {
    lines.push(`• ${item.brand} ${item.name}`);
    lines.push(`Talle ${item.size}`);
    lines.push(`Cantidad ${item.qty}`);
    lines.push(`Precio ${formatPrice(item.unitPrice * item.qty)}`);
    lines.push("");
  }

  lines.push(`Total: ${formatPrice(order.total)}`);

  if (order.customerName?.trim()) {
    lines.push("", `Mi nombre: ${order.customerName.trim()}`);
  }
  if (order.note?.trim()) {
    lines.push(`Nota: ${order.note.trim()}`);
  }
  if (order.code) {
    lines.push("", `Pedido ${order.code}`);
  }

  return lines.join("\n");
}

/** Deja sólo dígitos: WhatsApp rechaza el "+", los espacios y los guiones. */
export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function whatsappUrl(phone: string, message: string) {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
