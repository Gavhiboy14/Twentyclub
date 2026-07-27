"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePersistentState } from "./persistent";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  size: string;
  qty: number;
  unitPrice: number;
  image: string;
  /** Tope de stock del talle, para no dejar sumar más de lo que hay. */
  maxStock: number;
}

/** Un producto está en el carrito una vez por talle. */
const lineKey = (productId: string, size: string) => `${productId}::${size}`;

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  total: number;
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (item: CartItem) => void;
  setQty: (productId: string, size: string, qty: number) => void;
  remove: (productId: string, size: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { value: items, setValue, hydrated } = usePersistentState<CartItem[]>(
    "tc:cart",
    [],
  );
  const [isOpen, setOpen] = useState(false);

  const add = useCallback(
    (incoming: CartItem) => {
      setValue((current) => {
        const key = lineKey(incoming.productId, incoming.size);
        const existing = current.find(
          (i) => lineKey(i.productId, i.size) === key,
        );
        if (!existing) return [...current, incoming];

        return current.map((i) =>
          lineKey(i.productId, i.size) === key
            ? { ...i, qty: Math.min(i.qty + incoming.qty, i.maxStock) }
            : i,
        );
      });
      setOpen(true);
    },
    [setValue],
  );

  const setQty = useCallback(
    (productId: string, size: string, qty: number) => {
      setValue((current) => {
        if (qty <= 0) {
          return current.filter(
            (i) => lineKey(i.productId, i.size) !== lineKey(productId, size),
          );
        }
        return current.map((i) =>
          lineKey(i.productId, i.size) === lineKey(productId, size)
            ? { ...i, qty: Math.min(qty, i.maxStock) }
            : i,
        );
      });
    },
    [setValue],
  );

  const remove = useCallback(
    (productId: string, size: string) => {
      setValue((current) =>
        current.filter(
          (i) => lineKey(i.productId, i.size) !== lineKey(productId, size),
        ),
      );
    },
    [setValue],
  );

  const clear = useCallback(() => setValue([]), [setValue]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.qty, 0);
    return {
      items,
      count: items.reduce((acc, i) => acc + i.qty, 0),
      subtotal,
      total: subtotal,
      hydrated,
      isOpen,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      add,
      setQty,
      remove,
      clear,
    };
  }, [items, hydrated, isOpen, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart tiene que usarse dentro de <CartProvider>");
  return ctx;
}
