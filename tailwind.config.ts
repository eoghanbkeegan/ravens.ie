import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  extend: {
    colors: {
      ravens: {
        red: '#c8102e',
        dark: '#0f0f0f',
        surface: '#161616',
        border: '#252525',
        muted: '#888888',
      }
    }
  }
},
  plugins: [],
};
export default config;
