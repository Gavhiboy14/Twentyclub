"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePersistentState } from "./persistent";

interface FavoritesContextValue {
  ids: string[];
  hydrated: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { value: ids, setValue, hydrated } = usePersistentState<string[]>(
    "tc:favorites",
    [],
  );

  const toggle = useCallback(
    (id: string) => {
      setValue((current) =>
        current.includes(id)
          ? current.filter((x) => x !== id)
          : [id, ...current],
      );
    },
    [setValue],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ids,
      hydrated,
      has: (id) => ids.includes(id),
      toggle,
      clear: () => setValue([]),
    }),
    [ids, hydrated, toggle, setValue],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites tiene que usarse dentro de <FavoritesProvider>");
  }
  return ctx;
}
