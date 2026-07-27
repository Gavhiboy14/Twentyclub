"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Estado que sobrevive al refresh. Arranca siempre con `initial` para que el
 * HTML del servidor y el primer render del cliente coincidan; el valor guardado
 * entra después, en el efecto.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      // localStorage bloqueado o JSON corrupto: seguimos con el valor inicial.
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Cuota llena o modo privado: no rompemos la navegación por esto.
    }
  }, [key, value, hydrated]);

  // Mantiene sincronizadas dos pestañas abiertas del sitio.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== key || event.newValue == null) return;
      try {
        setValue(JSON.parse(event.newValue) as T);
      } catch {
        /* ignorado */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const reset = useCallback(() => setValue(initial), [initial]);

  return { value, setValue, hydrated, reset } as const;
}
