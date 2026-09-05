/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./src/client/**/*.{html,js,ts,css}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',
          black: '#09090b',
          surface: '#ffffff',
          bg: '#f8fafc',
          border: '#e2e8f0',
          'border-subtle': '#f1f5f9',
          'text-primary': '#09090b',
          'text-secondary': '#64748b',
          'text-muted': '#94a3b8',
          lime: {
            50: '#f7fee7',
            100: '#ecfccb',
            200: '#d9f99d',
            300: '#bef264',
            400: '#a3e635',
            500: '#84cc16',
            600: '#65a30d',
            700: '#4d7c0f',
            800: '#3f6212',
            900: '#365314'
          }
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ]
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
        lime: '0 4px 14px 0 rgba(132, 204, 22, 0.35)'
      }
    },
  },
  plugins: [],
}
