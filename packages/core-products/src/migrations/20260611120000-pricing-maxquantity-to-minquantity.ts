import { createLogger } from '@unchainedshop/logger';
import type { MigrationRepository } from '@unchainedshop/mongodb';
import { ProductsCollection, type ProductPrice } from '../db/ProductsCollection.ts';

const logger = createLogger('unchained:core-products:migrations');

type LegacyProductPrice = ProductPrice & { maxQuantity?: number };

/**
 * Selector matching products that still carry at least one quantity tier without
 * a `minQuantity` floor (legacy `maxQuantity`-keyed or bare base tiers). The
 * migration is a no-op once every tier has a `minQuantity`, so it is safe to re-run.
 */
const UNMIGRATED_PRICING_SELECTOR = {
  'commerce.pricing': { $elemMatch: { minQuantity: { $exists: false } } },
};

/**
 * Convert a product's quantity-tier pricing from the inclusive-upper-bound
 * `maxQuantity` model to the lower-bound `minQuantity` model.
 *
 * Tiers are grouped per (countryCode, currencyCode) and sorted ascending by
 * `maxQuantity` with a falsy/absent `maxQuantity` treated as the open-ended top
 * tier (sorts last). The lowest tier becomes `minQuantity: 0` (base) and every
 * subsequent tier's floor is the previous tier's `maxQuantity + 1`.
 */
const convertPricingToMinQuantity = (pricing: LegacyProductPrice[] = []): ProductPrice[] => {
  const groups = new Map<string, LegacyProductPrice[]>();
  for (const level of pricing) {
    const key = `${level.countryCode}:${level.currencyCode}`;
    const group = groups.get(key);
    if (group) group.push(level);
    else groups.set(key, [level]);
  }

  const nextPricing: ProductPrice[] = [];
  for (const levels of groups.values()) {
    const sorted = [...levels].sort(
      (a, b) =>
        (a.maxQuantity || Number.POSITIVE_INFINITY) - (b.maxQuantity || Number.POSITIVE_INFINITY),
    );

    const seenMax = new Set<number>();
    let previousMax = 0;
    sorted.forEach((level, index) => {
      if (level.maxQuantity) {
        if (seenMax.has(level.maxQuantity)) {
          logger.warn(
            `Duplicate maxQuantity ${level.maxQuantity} for ${level.countryCode}/${level.currencyCode} — order resolved by stable sort`,
          );
        }
        seenMax.add(level.maxQuantity);
      }
      const { maxQuantity, ...rest } = level;
      nextPricing.push({ ...rest, minQuantity: index === 0 ? 0 : previousMax + 1 });
      previousMax = maxQuantity || previousMax;
    });
  }
  return nextPricing;
};

export default function migrateCommercePricingToMinQuantity(repository: MigrationRepository) {
  repository?.register({
    id: 20260611120000,
    name: 'Convert product commerce pricing tiers from maxQuantity to minQuantity',
    up: async () => {
      const { Products } = await ProductsCollection(repository.db);

      let migrated = 0;
      const cursor = Products.find(UNMIGRATED_PRICING_SELECTOR);
      for await (const product of cursor) {
        const nextPricing = convertPricingToMinQuantity(
          (product.commerce?.pricing ?? []) as LegacyProductPrice[],
        );
        await Products.updateOne({ _id: product._id }, { $set: { 'commerce.pricing': nextPricing } });
        migrated += 1;
      }

      if (migrated > 0) {
        logger.info(`Converted commerce pricing tiers to minQuantity on ${migrated} product(s)`);
      }
    },
  });
}
