import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import type { Product } from '@unchainedshop/core-products';
import usTaxRates from './us-tax-rates.json' with { type: 'json' };
import { compileEraRates, rateForDate } from './eraRates.ts';

// STATEWIDE BASE sales tax rates for the 50 US states + DC, bundled in
// us-tax-rates.json (see the json's `source`/`verifiedAt` fields; update via
// the `update-tax-rates` skill). This is a documented approximation: it
// covers the statewide rate (incl. mandatory statewide local components
// where a state has them) but NOT county/city add-ons, per-category
// taxability (groceries etc.), nexus thresholds or origin-vs-destination
// sourcing — full US compliance needs a tax service. US prices are
// conventionally net; net price rows get the tax added on top by the
// adapters, gross rows get it extracted.
//
// Products carrying a `us-tax-category:exempt` tag are not taxed; delivery
// providers can opt their fee out with a `us-tax-category` configuration
// entry of `exempt` (shipping taxability varies by state).

export const US_COUNTRY_CODE = 'US';
export const US_SALES_TAX_EXEMPT_VALUE = 'exempt';

const stateRates: Record<string, (referenceDate?: Date) => number> = Object.fromEntries(
  Object.entries(usTaxRates.states).map(([stateCode, eras]) => [
    stateCode,
    rateForDate(
      compileEraRates(eras, usTaxRates.timezones[stateCode as keyof typeof usTaxRates.timezones]),
    ),
  ]),
);

export const US_STATE_CODES: string[] = Object.keys(stateRates);

export const resolveUsSalesTaxRate = ({
  regionCode,
  referenceDate,
}: {
  regionCode?: string | null;
  referenceDate?: Date;
}): number | null => {
  const resolveRate = regionCode ? stateRates[regionCode.toUpperCase().trim()] : null;
  if (!resolveRate) return null;
  return resolveRate(referenceDate);
};

export const isProductExemptFromUsSalesTax = (product: Product): boolean =>
  Boolean(
    product?.tags?.some(
      (tag) => tag?.trim().toLowerCase() === `us-tax-category:${US_SALES_TAX_EXEMPT_VALUE}`,
    ),
  );

export const isDeliveryExemptFromUsSalesTax = (provider: DeliveryProvider): boolean =>
  provider?.configuration
    ?.find(({ key }) => key === 'us-tax-category')
    ?.value?.trim()
    .toLowerCase() === US_SALES_TAX_EXEMPT_VALUE;
