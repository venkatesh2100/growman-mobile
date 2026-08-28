/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#3c334c'
      },
      // Static-weight custom fonts (via @expo-google-fonts) — each key is its own
      // font file, so never pair these classes with font-bold/font-semibold/etc.
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        'display-bold': ['Fraunces_700Bold'],
        'display-black': ['Fraunces_900Black'],
        'display-italic': ['Fraunces_500Medium_Italic'],
        'display-bold-italic': ['Fraunces_700Bold_Italic'],
        sans: ['Manrope_400Regular'],
        'sans-medium': ['Manrope_500Medium'],
        'sans-semibold': ['Manrope_600SemiBold'],
        'sans-bold': ['Manrope_700Bold'],
        'sans-extrabold': ['Manrope_800ExtraBold'],
      },
    },
  },
  plugins: [],
}
