import { WorkerDirector, WorkerAdapter, type IWorkerAdapter } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
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

const createLanguageDialectList = (languages: Language[], countries: Country[]): string[] => {
  const result = new Set<string>();
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

export const BulkExportWorker: IWorkerAdapter<any, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.bulk-export',
  label: 'Bulk Export',
  version: '2.1.0',
  type: 'BULK_EXPORT',
  maxParallelAllocations: 1,

  doWork: async (payload, unchainedAPI) => {
    try {
      const { modules } = unchainedAPI;
      const languages = await modules.languages.findLanguages({ includeInactive: false });
      const countries = await modules.countries.findCountries({ includeInactive: false });
      const bulkExporter = unchainedAPI.bulkExporter.createBulkExporter({ entity: payload.type });
      await bulkExporter.validate(payload);
      const locales = createLanguageDialectList(languages, countries);
      const [result, error] = await bulkExporter.execute(payload, locales, unchainedAPI);

      if (error) {
        return {
          success: false,
          result: result!,
          error,
        };
      }
      return {
        success: true,
        result: { files: result },
      };
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
