/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: [
    "./*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./contents/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./background/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}"
  ],
  plugins: []
}

