// Price generation utilities with multi-currency support

// Exchange rate: 1 CHF = 0.92 USD (approximate)
const CHF_TO_USD_RATE = 0.92;

export interface PriceConfig {
  minCents: number;
  maxCents: number;
}

export interface GeneratedPrices {
  chf: number;
  usd: number;
}

export function generatePrice(config: PriceConfig, seed: number): GeneratedPrices {
  // Use seed for deterministic pricing
  const range = config.maxCents - config.minCents;
  const seedFactor = (seed * 9301 + 49297) % 233280;
  const normalizedSeed = seedFactor / 233280;

  // Generate CHF price (round to nearest 100 cents for cleaner prices)
  const rawChfPrice = config.minCents + range * normalizedSeed;
  const chfPrice = Math.round(rawChfPrice / 100) * 100;

  // Convert to USD
  const usdPrice = Math.round((chfPrice * CHF_TO_USD_RATE) / 100) * 100;

  return {
    chf: chfPrice,
    usd: usdPrice,
  };
}

export function formatPricingArray(prices: GeneratedPrices): {
  amount: number;
  currencyCode: string;
  countryCode: string;
  isTaxable: boolean;
  isNetPrice: boolean;
}[] {
  return [
    {
      amount: prices.chf,
      currencyCode: 'CHF',
      countryCode: 'CH',
      isTaxable: true,
      isNetPrice: true,
    },
    {
      amount: prices.usd,
      currencyCode: 'USD',
      countryCode: 'US',
      isTaxable: true,
      isNetPrice: true,
    },
  ];
}

// Price range bucket for filter assignment
export function getPriceRangeBucket(priceCents: number): string {
  if (priceCents < 10000) return 'under-100';
  if (priceCents < 25000) return '100-250';
  if (priceCents < 50000) return '250-500';
  if (priceCents < 100000) return '500-1000';
  return 'over-1000';
}
