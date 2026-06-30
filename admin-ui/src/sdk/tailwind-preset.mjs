/**
 * Tailwind CSS preset for Unchained Admin UI plugins.
 *
 * Use this in your plugin's tailwind.config.js to get the same
 * design tokens and utility classes as the admin-ui host.
 *
 * Usage:
 *   import { unchainedPreset } from '@unchainedshop/admin-ui/tailwind-preset';
 *   export default { presets: [unchainedPreset] };
 *
 * Note: In production, plugins render inside the admin-ui which already
 * has these tokens loaded. This preset is primarily for standalone
 * development and testing.
 */

export const tokens = {
  light: {
    '--token-surface': '#ffffff',
    '--token-surface-subtle': '#f8fafc',
    '--token-surface-raised': '#f1f5f9',
    '--token-surface-input': '#ffffff',
    '--token-border': '#cbd5e1',
    '--token-border-subtle': '#e2e8f0',
    '--token-text-primary': '#0f172a',
    '--token-text-secondary': '#475569',
    '--token-text-muted': '#64748b',
    '--token-text-on-dark': '#ffffff',
    '--token-accent': '#1e293b',
    '--token-accent-hover': '#020617',
    '--token-danger': '#f43f5e',
    '--token-danger-surface': '#fff1f2',
    '--token-success': '#10b981',
    '--token-warning': '#f59e0b',
    '--token-focus-ring': '#1e293b',
    '--token-text-on-accent': '#ffffff',
  },
  dark: {
    '--token-surface': '#1e293b',
    '--token-surface-subtle': '#0f172a',
    '--token-surface-raised': '#334155',
    '--token-surface-input': '#0f172a',
    '--token-border': '#475569',
    '--token-border-subtle': '#334155',
    '--token-text-primary': '#f1f5f9',
    '--token-text-secondary': '#94a3b8',
    '--token-text-muted': '#64748b',
    '--token-text-on-dark': '#ffffff',
    '--token-accent': '#475569',
    '--token-accent-hover': '#64748b',
    '--token-danger': '#fb7185',
    '--token-danger-surface': '#881337',
    '--token-success': '#34d399',
    '--token-warning': '#fbbf24',
    '--token-focus-ring': '#94a3b8',
    '--token-text-on-accent': '#ffffff',
  },
};

export const unchainedPreset = {
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--token-surface)',
          subtle: 'var(--token-surface-subtle)',
          raised: 'var(--token-surface-raised)',
          input: 'var(--token-surface-input)',
        },
        border: {
          DEFAULT: 'var(--token-border)',
          subtle: 'var(--token-border-subtle)',
        },
        'text-primary': 'var(--token-text-primary)',
        'text-secondary': 'var(--token-text-secondary)',
        'text-muted': 'var(--token-text-muted)',
        'text-on-dark': 'var(--token-text-on-dark)',
        'text-on-accent': 'var(--token-text-on-accent)',
        accent: {
          DEFAULT: 'var(--token-accent)',
          hover: 'var(--token-accent-hover)',
        },
        danger: {
          DEFAULT: 'var(--token-danger)',
          surface: 'var(--token-danger-surface)',
        },
        success: 'var(--token-success)',
        warning: 'var(--token-warning)',
        'focus-ring': 'var(--token-focus-ring)',
      },
    },
  },
};

export default unchainedPreset;
