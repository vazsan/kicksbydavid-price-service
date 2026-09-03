"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

// Not a React hook — just a plain module-scope registration guard. Named
// without a "use" prefix so the react-hooks/rules-of-hooks lint rule
// doesn't treat call sites (e.g. inside useEffect) as hook violations.
export function registerGsap() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return { gsap, ScrollTrigger };
}
