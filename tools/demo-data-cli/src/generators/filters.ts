// Filter generator for bulk import

import type { BulkImportEvent, FilterPayload, FilterType } from '../types/bulk-import.js';
import { filterTranslations, filterOptionTranslations } from '../data/translations.js';
import { brands } from '../data/brands.js';
import { generateFilterId } from '../utils/id-generator.js';

interface FilterDefinition {
  key: string;
  type: FilterType;
  options?: string[];
  dynamicOptions?: () => string[];
}

const filterDefinitions: FilterDefinition[] = [
  {
    key: 'brand',
    type: 'MULTI_CHOICE',
    dynamicOptions: () => brands.map((b) => b.id),
  },
  {
    key: 'priceRange',
    type: 'MULTI_CHOICE',
    options: ['under-100', '100-250', '250-500', '500-1000', 'over-1000'],
  },
  {
    key: 'inStock',
    type: 'SWITCH',
  },
  {
    key: 'rating',
    type: 'MULTI_CHOICE',
    options: ['4-stars-up', '3-stars-up'],
  },
  {
    key: 'color',
    type: 'MULTI_CHOICE',
    options: ['black', 'white', 'silver', 'blue', 'red', 'gold', 'green', 'pink'],
  },
  {
    key: 'wireless',
    type: 'SWITCH',
  },
  {
    key: 'screenSize',
    type: 'MULTI_CHOICE',
    options: ['under-6', '6-10', '10-15', '15-17', 'over-17'],
  },
  {
    key: 'memory',
    type: 'MULTI_CHOICE',
    options: ['4gb', '8gb', '16gb', '32gb', '64gb', '128gb', '256gb', '512gb', '1tb'],
  },
  {
    key: 'connectivity',
    type: 'MULTI_CHOICE',
    options: ['usb-c', 'usb-a', 'bluetooth', 'wifi', 'hdmi', 'thunderbolt'],
  },
  {
    key: 'featured',
    type: 'SWITCH',
  },
];

function getOptionTranslation(
  filterKey: string,
  optionValue: string,
): Record<string, { title: string }> {
  const translations = filterOptionTranslations[filterKey]?.[optionValue];

  if (translations) {
    return {
      en: { title: translations.en },
      de: { title: translations.de },
      fr: { title: translations.fr },
    };
  }

  // For brands, use the brand name directly
  const brand = brands.find((b) => b.id === optionValue);
  if (brand) {
    return {
      en: { title: brand.name },
      de: { title: brand.name },
      fr: { title: brand.name },
    };
  }

  // Default: capitalize the option value
  const title = optionValue
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    en: { title },
    de: { title },
    fr: { title },
  };
}

export function generateFilters(): BulkImportEvent<FilterPayload>[] {
  const events: BulkImportEvent<FilterPayload>[] = [];

  for (const definition of filterDefinitions) {
    const translations = filterTranslations[definition.key];

    if (!translations) {
      console.warn(`Missing translations for filter: ${definition.key}`);
      continue;
    }

    const options = definition.dynamicOptions?.() ?? definition.options ?? [];

    const payload: FilterPayload = {
      _id: generateFilterId(definition.key),
      specification: {
        key: definition.key,
        type: definition.type,
        isActive: true,
        content: {
          en: {
            title: translations.en.title,
            subtitle: translations.en.subtitle,
          },
          de: {
            title: translations.de.title,
            subtitle: translations.de.subtitle,
          },
          fr: {
            title: translations.fr.title,
            subtitle: translations.fr.subtitle,
          },
        },
      },
    };

    // Add options for choice filters
    if (definition.type !== 'SWITCH' && options.length > 0) {
      payload.specification.options = options.map((value) => ({
        value,
        content: getOptionTranslation(definition.key, value),
      }));
    }

    events.push({
      entity: 'FILTER',
      operation: 'CREATE',
      payload,
    });
  }

  return events;
}

export function getFilterIds(): string[] {
  return filterDefinitions.map((def) => generateFilterId(def.key));
}
