import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#0a0908",
        charcoal: "#121110",
        bone: "#f4efe6",
        parchment: "#eae3d6",
        fog: "#8b8680",
        smoke: "#3a3733",
        jordan: "#c8102e",
        gold: "#b08d57",
      },
      fontFamily: {
        display: ["var(--font-anton)", "sans-serif"],
        serif: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.06em",
        widest2: "0.35em",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
        "spotlight": "radial-gradient(circle at 50% 35%, rgba(244,239,230,0.14), rgba(10,9,8,0) 60%)",
      },
    },
  },
  plugins: [],
};
export default config;
