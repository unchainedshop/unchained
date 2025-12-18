import { WorkerDirector, WorkerAdapter, type IWorkerAdapter } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import exportProducts from './exportProducts.ts';
import exportAssortments from './exportAssortments.ts';
import exportFilters from './exportFilters.ts';
import type { Language } from '@unchainedshop/core-languages';
import type { Country } from '@unchainedshop/core-countries';

const isSupportedLocale = (locale) => {
  try {
    const dtf = new Intl.DateTimeFormat(locale);
    const resolved = dtf.resolvedOptions().locale;
    return resolved.toLowerCase() === locale.toLowerCase();
  } catch (e) {
    console.error(e);
    return false;
  }
};

const createLanguageDialectList = (languages: Language[], countries: Country[]) => {
  const result = new Set();
  (languages || []).forEach(({ isoCode: baseIsoCode }) => {
    result.add(baseIsoCode);
    (countries || []).forEach(({ isoCode: countryIsoCode }) => {
      const dialectIsoCode = [baseIsoCode, countryIsoCode.toUpperCase()].join('-');
      if (isSupportedLocale(dialectIsoCode)) result.add(dialectIsoCode);
    });
  });

  return Array.from(result);
};

const logger = createLogger('unchained:bulk-export');

const handlers = {
  ASSORTMENTS: exportAssortments,
  FILTERS: exportFilters,
  PRODUCTS: exportProducts,
};

export const BulkExportWorker: IWorkerAdapter<any, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.bulk-export',
  label: 'Bulk Export',
  version: '2.1.0',
  type: 'BULK_EXPORT',
  maxParallelAllocations: 1,

  doWork: async ({ type, ...params }, unchainedAPI) => {
    try {
      const { modules } = unchainedAPI;
      const languages = await modules.languages.findLanguages({ includeInactive: false });
      const countries = await modules.countries.findCountries({ includeInactive: false });
      const locales = createLanguageDialectList(languages, countries);
      const handler = handlers[type];
      if (!handler) throw new Error(`Unsupported export type: ${type}`);

      const files = await handler(params, locales, unchainedAPI);
      return { success: true, result: { files } };
    } catch (err: any) {
      logger.error(err);
      return {
        success: false,
        error: { name: err.name, message: err.message, stack: err.stack },
      };
    }
  },
};

WorkerDirector.registerAdapter(BulkExportWorker);
