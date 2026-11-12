/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        dark: {
          bg: '#0B0F19',
          surface: '#111827',
          card: '#161F33',
          border: '#1E293B',
          muted: '#94A3B8',
        },
        editorial: {
          bg: '#F8F9FA',
          surface: '#FFFFFF',
          subtle: '#F1F5F9',
          ink: '#0F172A',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],     // was 0.75rem (12px) -> now 0.875rem (14px) [+2pt]
        'sm': ['1rem', { lineHeight: '1.5rem' }],          // was 0.875rem (14px) -> now 1rem (16px) [+2pt]
        'base': ['1.125rem', { lineHeight: '1.75rem' }],   // was 1rem (16px) -> now 1.125rem (18px) [+2pt]
        'lg': ['1.25rem', { lineHeight: '1.875rem' }],     // was 1.125rem (18px) -> now 1.25rem (20px) [+2pt]
      }
    },
  },
  plugins: [],
}
