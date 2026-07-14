/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // === 极光 Aurora 主题配色 ===
        aurora: {
          // 核心极光色
          green:  '#2DD4BF',  // 翠绿极光
          cyan:   '#22D3EE',  // 青色极光
          blue:   '#60A5FA',  // 蓝色极光
          purple: '#A78BFA',  // 紫色极光
          pink:   '#F472B6',  // 粉色极光
          teal:   '#14B8A6',  // 深绿极光
        },
        // 基础色
        surface: "#1E1E2E",
        base: {
          900: '#0F0F1A',
          850: '#13131F',
          800: '#1A1A2E',
          700: '#252540',
          600: '#2E2E4A',
        },
        // 功能色
        accent: { 
          DEFAULT: '#2DD4BF',
          hover: '#5EEAD4',
          dim: '#0D9488',
        },
        success: '#34D399',
        warning: '#FBBF24',
        error:   '#F87171',
        info:    '#60A5FA',
        
        // 保留兼容旧引用
        v3: {
          navy: "#1E3A5F",
          gold: "#2DD4BF",
          dark: "#0F0F1A",
          surface: "#1E1E2E",
          elevated: "#252540",
          overlay: "rgba(15, 15, 26, 0.85)",
        },
      },
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Microsoft YaHei"', '"PingFang SC"', "sans-serif"],
        display: ['"Segoe UI Variable Display"', "sans-serif"],
        mono: ['"Cascadia Code"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      animation: {
        "fade-in": "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-right": "slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "stagger-fade": "fadeIn 0.3s ease-out backwards",
        "aurora-pulse": "auroraPulse 3s ease-in-out infinite",
        "aurora-shift": "auroraShift 8s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideRight: { "0%": { opacity: "0", transform: "translateX(-16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        auroraPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        auroraShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(45, 212, 191, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(45, 212, 191, 0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(135deg, #2DD4BF 0%, #60A5FA 25%, #A78BFA 50%, #F472B6 75%, #2DD4BF 100%)',
        'aurora-subtle': 'linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(96,165,250,0.1) 50%, rgba(167,139,250,0.1) 100%)',
      },
      backgroundSize: {
        'aurora': '400% 400%',
      },
      boxShadow: {
        'aurora-sm': '0 2px 8px rgba(45, 212, 191, 0.15)',
        'aurora-md': '0 4px 16px rgba(45, 212, 191, 0.2)',
        'aurora-lg': '0 8px 32px rgba(45, 212, 191, 0.25)',
      },
    },
  },
  plugins: [],
};
