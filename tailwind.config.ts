import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          felt: "#0b4d2c",
          feltDark: "#06301a",
          feltLight: "#12633a",
          gold: "#d4af37",
          goldLight: "#f5d77f",
          goldDark: "#997d1e",
          wood: "#3a1e05",
          woodDark: "#231102",
        },
      },
      boxShadow: {
        gold: "0 0 15px rgba(212, 175, 55, 0.4)",
        "gold-lg": "0 0 25px rgba(212, 175, 55, 0.6)",
        card: "0 4px 12px rgba(0, 0, 0, 0.35)",
        table: "inset 0 0 80px rgba(0, 0, 0, 0.8)",
      },
      backgroundImage: {
        "radial-felt": "radial-gradient(circle at center, #136a3e 0%, #0b4d2c 55%, #052614 100%)",
        "casino-rim": "linear-gradient(135deg, #4a2810 0%, #2b1406 50%, #150901 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
