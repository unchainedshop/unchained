import { Context } from '../../context.js';
import { log } from '@unchainedshop/logger';
import { createMcpErrorResponse, createMcpResponse } from '../utils/sharedSchemas.js';

export async function shopInfoHandler(context: Context) {
  const { version, userId, loaders, locale, countryCode } = context;

  try {
    log('handler shopInfoHandler', { userId });

    const language = await loaders.languageLoader.load({ isoCode: locale.language });

    const country = await loaders.countryLoader.load({ isoCode: countryCode });
    const defaultLanguageIsoCode = language?.isoCode
      ? `${language.isoCode}${country?.isoCode ? '-' + country.isoCode : ''}`
      : null;

    return createMcpResponse({ version, defaultLanguageIsoCode, country, language });
  } catch (error) {
    return createMcpErrorResponse('shopInfoHandler', error);
  }
}
