/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Use 'class' strategy → toggle with `class="dark"`
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb", // blue-600
          light: "#3b82f6",   // blue-500
          dark: "#1e40af",    // blue-800
        },
        secondary: {
          DEFAULT: "#64748b", // slate-500
          light: "#94a3b8",   // slate-400
          dark: "#475569",    // slate-600
        },
        success: {
          DEFAULT: "#16a34a", // green-600
          light: "#22c55e",   // green-500
          dark: "#15803d",    // green-700
        },
        warning: {
          DEFAULT: "#f59e0b", // amber-500
          light: "#fbbf24",   // amber-400
          dark: "#b45309",    // amber-700
        },
        danger: {
          DEFAULT: "#dc2626", // red-600
          light: "#ef4444",   // red-500
          dark: "#991b1b",    // red-800
        },
        neutral: {
          lightBg: "#f8fafc", // light mode background
          lightCard: "#ffffff",
          lightText: "#1e293b",

          darkBg: "#0f172a", // dark mode background
          darkCard: "#1e293b",
          darkText: "#f1f5f9",
        },
      },
    },
  },
  plugins: [],
};
