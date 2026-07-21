import { useState, useEffect } from "react";

// Hook générique matchMedia, ex: useMediaQuery("(min-width: 1280px)")
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener ? mql.addEventListener("change", onChange) : mql.addListener(onChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", onChange) : mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

// Points de rupture partagés par toute l'app
export const BREAKPOINTS = { tablet: 768, desktop: 1280 };

// Raccourci : renvoie "mobile" | "tablet" | "desktop"
export function useViewport() {
  const isTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
  if (isDesktop) return "desktop";
  if (isTablet) return "tablet";
  return "mobile";
}
