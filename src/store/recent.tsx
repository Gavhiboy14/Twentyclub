"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { usePersistentState } from "./persistent";

const MAX_RECENT = 8;

interface RecentContextValue {
  slugs: string[];
  hydrated: boolean;
  track: (slug: string) => void;
}

const RecentContext = createContext<RecentContextValue | null>(null);

export function RecentProvider({ children }: { children: ReactNode }) {
  const { value: slugs, setValue, hydrated } = usePersistentState<string[]>(
    "tc:recent",
    [],
  );

  const track = useCallback(
    (slug: string) => {
      setValue((current) =>
        [slug, ...current.filter((s) => s !== slug)].slice(0, MAX_RECENT),
      );
    },
    [setValue],
  );

  const value = useMemo<RecentContextValue>(
    () => ({ slugs, hydrated, track }),
    [slugs, hydrated, track],
  );

  return <RecentContext.Provider value={value}>{children}</RecentContext.Provider>;
}

export function useRecent() {
  const ctx = useContext(RecentContext);
  if (!ctx) throw new Error("useRecent tiene que usarse dentro de <RecentProvider>");
  return ctx;
}

/** Se monta en la página de producto para registrar la visita. */
export function TrackRecentView({ slug }: { slug: string }) {
  const { track } = useRecent();
  useEffect(() => {
    track(slug);
  }, [slug, track]);
  return null;
}
