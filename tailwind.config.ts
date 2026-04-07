import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mtn: {
          yellow: "#ffc900",
          black: "#0b0b0b",
          ink: "#111111",
          slate: "#202020",
          gold: "#f7d94c",
          soft: "#f4f0dc",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255, 201, 0, 0.15), 0 18px 50px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "mtn-grid":
          "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
      },
      animation: {
        float: "float 10s ease-in-out infinite",
        pulseSlow: "pulseSlow 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "0.75" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}

export default config
