// Product generator for bulk import

import type { BulkImportEvent, ProductPayload, ProductLocalizedContent } from '../types/bulk-import.js';
import { productTemplates, generateDescription } from '../data/electronics-catalog.js';
import { brands } from '../data/brands.js';
import { generateProductId, generateSku } from '../utils/id-generator.js';
import { generateProductSlug } from '../utils/slug-generator.js';
import { generatePrice, formatPricingArray, getPriceRangeBucket } from '../utils/price-generator.js';

export interface GeneratedProduct {
  event: BulkImportEvent<ProductPayload>;
  assortmentId: string;
  filterAttributes: {
    brand: string;
    priceRange: string;
    color?: string;
    wireless?: boolean;
    screenSize?: string;
    memory?: string;
    connectivity?: string[];
  };
}

function generateVariationCombinations(
  variations: Array<{ key: string; values: (string | number | boolean)[] }>
): Array<Record<string, string | number | boolean>> {
  if (variations.length === 0) return [{}];

  const [first, ...rest] = variations;
  const restCombinations = generateVariationCombinations(rest);

  const combinations: Array<Record<string, string | number | boolean>> = [];
  for (const value of first.values) {
    for (const restCombo of restCombinations) {
      combinations.push({
        [first.key]: value,
        ...restCombo,
      });
    }
  }

  return combinations;
}

export function generateProducts(targetCount: number): GeneratedProduct[] {
  const products: GeneratedProduct[] = [];
  let globalIndex = 0;

  // Calculate how many products per template to reach target
  const productsPerTemplate = Math.ceil(targetCount / productTemplates.length);

  for (const template of productTemplates) {
    // Get brands for this category
    const templateBrands = brands.filter((b) => b.categories.includes(template.category));
    if (templateBrands.length === 0) continue;

    // Generate variation combinations
    const combinations = generateVariationCombinations(template.variations);
    const productsForTemplate: GeneratedProduct[] = [];

    // Distribute across brands and variations, repeating if necessary
    let iteration = 0;
    let comboIndex = 0;
    while (productsForTemplate.length < productsPerTemplate) {
      for (const brand of templateBrands) {
        for (const combo of combinations) {
          if (productsForTemplate.length >= productsPerTemplate) break;

          globalIndex++;
        const productIndex = globalIndex;

        // Generate price
        const prices = generatePrice(
          { minCents: template.priceRange.min, maxCents: template.priceRange.max },
          productIndex
        );

        // Build product title with specs
        const specParts: string[] = [];
        if (combo.screenSize) specParts.push(`${combo.screenSize}"`);
        if (combo.memory) specParts.push(`${combo.memory}GB`);
        if (combo.processor) specParts.push(String(combo.processor));
        if (combo.storage) specParts.push(`${combo.storage}GB`);
        if (combo.resolution) specParts.push(String(combo.resolution));
        if (combo.type) specParts.push(String(combo.type));

        const specString = specParts.join(' ');

        // Generate localized content
        const content: Record<string, ProductLocalizedContent> = {};
        for (const locale of ['en', 'de', 'fr'] as const) {
          const title = `${brand.name} ${template.baseTitle[locale]}${specString ? ` ${specString}` : ''}`;
          const slug = generateProductSlug(brand.name, template.category, specString);
          const description = generateDescription(template, brand.name, combo, locale);

          content[locale] = {
            title,
            slug: locale === 'en' ? slug : `${slug}-${locale}`,
            description,
            brand: brand.name,
            vendor: brand.name,
            labels: template.tags.slice(0, 2).map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
          };
        }

        // Determine weight
        const weightRange = template.weightRange.max - template.weightRange.min;
        const weight =
          template.weightRange.min + Math.round(weightRange * ((productIndex % 100) / 100));

        // Build tags
        const tags = [
          ...template.tags,
          brand.id,
          template.category,
          template.subcategory || template.category,
        ].filter(Boolean);

        // Add featured tag to some products
        if (productIndex % 10 === 0) {
          tags.push('featured');
        }

        // Determine color
        let color: string | undefined;
        if (combo.color) {
          color = String(combo.color);
        } else if (template.colorOptions && template.colorOptions.length > 0) {
          color = template.colorOptions[comboIndex % template.colorOptions.length];
        }
        if (color) {
          tags.push(color);
        }

        // Determine wireless
        const isWireless = template.isWireless || Boolean(combo.wireless);
        if (isWireless) {
          tags.push('wireless');
        }

        const payload: ProductPayload = {
          _id: generateProductId(template.category, brand.id, productIndex),
          specification: {
            type: 'SIMPLE_PRODUCT',
            sequence: productIndex,
            published: new Date().toISOString(),
            tags,
            commerce: {
              pricing: formatPricingArray(prices),
            },
            warehousing: {
              sku: generateSku(template.category, brand.id, productIndex, specString),
              baseUnit: 'ST',
            },
            supply: {
              weightInGram: weight,
            },
            meta: {
              category: template.category,
              subcategory: template.subcategory,
              brand: brand.id,
            },
            content,
          },
        };

        // Determine screen size bucket
        let screenSizeBucket: string | undefined;
        if (combo.screenSize) {
          const size = Number(combo.screenSize);
          if (size < 6) screenSizeBucket = 'under-6';
          else if (size < 10) screenSizeBucket = '6-10';
          else if (size < 15) screenSizeBucket = '10-15';
          else if (size < 17) screenSizeBucket = '15-17';
          else screenSizeBucket = 'over-17';
        } else if (template.screenSizes && template.screenSizes.length > 0) {
          screenSizeBucket = template.screenSizes[0];
        }

        // Determine memory bucket
        let memoryBucket: string | undefined;
        if (combo.memory) {
          const mem = Number(combo.memory);
          if (mem <= 4) memoryBucket = '4gb';
          else if (mem <= 8) memoryBucket = '8gb';
          else if (mem <= 16) memoryBucket = '16gb';
          else if (mem <= 32) memoryBucket = '32gb';
          else if (mem <= 64) memoryBucket = '64gb';
          else if (mem <= 128) memoryBucket = '128gb';
          else if (mem <= 256) memoryBucket = '256gb';
          else if (mem <= 512) memoryBucket = '512gb';
          else memoryBucket = '1tb';
        } else if (template.memoryOptions && template.memoryOptions.length > 0) {
          memoryBucket = template.memoryOptions[0];
        }

        productsForTemplate.push({
          event: {
            entity: 'PRODUCT',
            operation: 'CREATE',
            payload,
          },
          assortmentId: template.assortmentId,
          filterAttributes: {
            brand: brand.id,
            priceRange: getPriceRangeBucket(prices.chf),
            color,
            wireless: isWireless,
            screenSize: screenSizeBucket,
            memory: memoryBucket,
            connectivity: template.connectivityOptions,
          },
        });

        comboIndex++;
        }

        if (productsForTemplate.length >= productsPerTemplate) break;
      }
      iteration++;
      if (iteration > 100) break; // Safety limit
    }

    products.push(...productsForTemplate);

    if (products.length >= targetCount) break;
  }

  // Trim to exact count
  return products.slice(0, targetCount);
}
