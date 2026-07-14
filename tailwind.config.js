/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#2B2B2B",
        v3: {
          navy: "#1E3A5F",
          gold: "#C5A059",
          dark: "#1C1C1C",
          surface: "#2B2B2B",
          elevated: "#333333",
          overlay: "rgba(28, 28, 28, 0.85)",
        },
        accent: {
          DEFAULT: "#0078D4",
          hover: "#1A8CD8",
        },
        success: "#2EA44F",
        warning: "#D4A017",
        error: "#D13438",
        info: "#0078D4",
      },
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Microsoft YaHei"', '"PingFang SC"', "sans-serif"],
        display: ['"Segoe UI Variable Display"', "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "stagger-fade": "fadeIn 0.3s ease-out backwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
