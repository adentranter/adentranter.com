import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
  		fontFamily: {
  			sans: [
  				'Proxima Nova',
                    ...fontFamily.sans
                ],
  			heading: [
  				'SharpSansBold',
                    ...fontFamily.sans
                ],
  			sharp: [
  				'SharpSans',
  				'sans-serif'
  			]
  		},
      colors: {
        background: {
          DEFAULT: "#f8f9fa",
          dark: "#1a1a1a",
        },
        primary: "white",
        accent: {
          DEFAULT: "cream",//real navy
          secondary: "silver",//real pink
          muted: "gray",
          success: "green",
        },
      },
    },
  },
} satisfies Config;

export default config;
