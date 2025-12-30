// Configuration defaults and types

export const DEFAULT_CONFIG = {
  endpoint: 'http://localhost:4010/bulk-import',
  products: 10000,
  chunkSize: 500,
  dryRun: false,
  verbose: false,
} as const;

export const SUPPORTED_LOCALES = ['en', 'de', 'fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const SUPPORTED_CURRENCIES = ['CHF', 'USD'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
