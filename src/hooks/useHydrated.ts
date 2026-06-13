import { useEffect, useState } from "react";

/**
 * Returns true once the component has mounted on the client.
 * Use to guard rendering that depends on localStorage (Zustand persist)
 * or `new Date()` to avoid SSR hydration mismatches.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}