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
        primary: "#42CAFF",
        accent: {
          DEFAULT: "#1e61b0",//real navy
          secondary: "#1658bf",//real pink
          muted: "#3C5256",
          success: "#255F37",
        },
      },
    },
  },
} satisfies Config;

export default config;
