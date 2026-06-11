const CSS_VALUE_RE = /^[a-zA-Z0-9#().,/%\s\-_]+$/;

export interface AdminUIThemeTokens {
  surface?: string;
  'surface-subtle'?: string;
  'surface-raised'?: string;
  'surface-input'?: string;
  border?: string;
  'border-subtle'?: string;
  'text-primary'?: string;
  'text-secondary'?: string;
  'text-muted'?: string;
  'text-on-dark'?: string;
  accent?: string;
  'accent-hover'?: string;
  danger?: string;
  'danger-surface'?: string;
  success?: string;
  warning?: string;
  'focus-ring'?: string;
  'text-on-accent'?: string;
}

export interface AdminUIThemeConfig {
  light?: AdminUIThemeTokens;
  dark?: AdminUIThemeTokens;
}

const sanitizeCSSValue = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed || !CSS_VALUE_RE.test(trimmed)) return null;
  return trimmed;
};

const buildTokenBlock = (selector: string, tokens: AdminUIThemeTokens): string | null => {
  const vars = Object.entries(tokens)
    .map(([key, value]) => {
      const safe = sanitizeCSSValue(value);
      return safe ? `  --token-${key}: ${safe};` : null;
    })
    .filter(Boolean);
  if (vars.length === 0) return null;
  return `${selector} {\n${vars.join('\n')}\n}`;
};

export const generateThemeCSS = (theme?: AdminUIThemeConfig): string => {
  if (!theme) return '/* default theme */';
  const blocks: string[] = [];
  if (theme.light) {
    const block = buildTokenBlock(':root:root', theme.light);
    if (block) blocks.push(block);
  }
  if (theme.dark) {
    const block = buildTokenBlock('.dark.dark', theme.dark);
    if (block) blocks.push(block);
  }
  return blocks.length > 0 ? blocks.join('\n\n') : '/* default theme */';
};
