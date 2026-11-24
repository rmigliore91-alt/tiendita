/** @type {import('tailwindcss').Config} */
// Sistema de diseño Taita — compartido con el Portal Taita (RRHH).
// Arena como superficie, turquesa profundo para acciones, ámbar del logo como acento.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // === Marca Taita — ámbar del logo ===
        'brand': '#f4b030',
        'brand-ink': '#8a5a00',
        'brand-soft': '#fdf0d5',
        'on-brand': '#2b2b2a',
        // === Primarios — Turquesa profundo (acciones, enlaces, navegación) ===
        'primary': '#164e51',
        'primary-container': '#1f6b6f',
        'primary-fixed': '#ddf0f0',
        'primary-fixed-dim': '#b6e8e3',
        'on-primary': '#ffffff',
        'on-primary-fixed': '#0f3a3c',
        // === Secundarios — Ámbar ===
        'secondary': '#8a5a00',
        'secondary-container': '#f4b030',
        'secondary-fixed': '#fdf0d5',
        'secondary-fixed-dim': '#fadfa6',
        'on-secondary-fixed': '#3a2a00',
        // === Terciarios — Verde (entradas, stock OK) ===
        'tertiary': '#22613c',
        'tertiary-container': '#2f8a55',
        'tertiary-fixed': '#e3f1e8',
        'tertiary-fixed-dim': '#9fd3b2',
        'on-tertiary-fixed': '#0f3b22',
        // === Error — Coral (salidas, sin stock) ===
        'error': '#b23a1c',
        'error-container': '#fce6df',
        'error-outline': '#f4bfae',
        'error-dot': '#de5021',
        'on-error': '#ffffff',
        'on-error-container': '#7a2410',
        // === Advertencia — Ámbar (stock bajo) ===
        'success': '#2f8a55',
        'warning': '#e39b12',
        'warning-container': '#fdf0d5',
        'warning-outline': '#fadfa6',
        'on-warning-container': '#7a4f00',
        // === Precaución — Naranja tostado (vence pronto, zona 4) ===
        'caution': '#d4691e',
        'caution-container': '#fbe8d8',
        'caution-outline': '#f2c6a2',
        'on-caution-container': '#8a3d0b',
        // === Info — Turquesa claro (zona 2, presupuestos) ===
        'info': '#57bbbf',
        'info-container': '#e3efef',
        'info-outline': '#b6dcdd',
        'on-info-container': '#1f5f62',
        // === Superficies (tono arena) ===
        'surface': '#faf8f4',
        'surface-dim': '#e5dfd3',
        'surface-variant': '#efeae0',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f6f3ee',
        'surface-container': '#f1ede6',
        'surface-container-high': '#ebe6dc',
        'surface-container-highest': '#e4ded2',
        // === Texto — Carbón del logo ===
        'on-surface': '#2b2b2a',
        'on-surface-variant': '#5e5c58',
        'inverse-surface': '#2b2b2a',
        // === Contornos ===
        'outline': '#6f6c66',
        'outline-variant': '#d9d3c7',
        'background': '#faf8f4',
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        display: ['Arvo', 'Georgia', 'serif'],
      },
      fontSize: {
        'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-sm': ['20px', { lineHeight: '28px', letterSpacing: '0em', fontWeight: '600' }],
        'title-md':    ['18px', { lineHeight: '26px', letterSpacing: '0em', fontWeight: '600' }],
        'title-sm':    ['16px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '600' }],
        'body-md':     ['14px', { lineHeight: '22px', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm':     ['13px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '400' }],
        'label-lg':    ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '600' }],
        'label-md':    ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-sm':    ['11px', { lineHeight: '14px', letterSpacing: '0.03em', fontWeight: '500' }],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
        full: '9999px',
      },
      boxShadow: {
        'card':        '0 1px 3px 0 rgba(43,43,42,0.05), 0 1px 2px -1px rgba(43,43,42,0.04)',
        'card-hover':  '0 4px 6px -1px rgba(43,43,42,0.07), 0 2px 4px -2px rgba(43,43,42,0.05)',
        'modal':       '0 20px 25px -5px rgba(43,43,42,0.10), 0 8px 10px -6px rgba(43,43,42,0.05)',
        'sidebar':     '1px 0 8px rgba(43,43,42,0.04)',
        'input':       'inset 0 0 0 1px #d9d3c7',
        'input-focus': 'inset 0 0 0 2px #1f6b6f, 0 0 0 3px rgba(31,107,111,0.15)',
        'btn-primary': '0 2px 8px rgba(31,107,111,0.25)',
      },
    },
  },
  plugins: [],
};
