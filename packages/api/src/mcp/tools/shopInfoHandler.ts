import { Context } from '../../context.js';
import { log } from '@unchainedshop/logger';

export async function shopInfoHandler(context: Context) {
  const { version, userId, loaders, locale, countryCode } = context;

  try {
    log('handler shopInfoHandler', { userId });

    const language = await loaders.languageLoader.load({ isoCode: locale.language });

    const country = await loaders.countryLoader.load({ isoCode: countryCode });
    const defaultLanguageIsoCode = language?.isoCode
      ? `${language.isoCode}${country?.isoCode ? '-' + country.isoCode : ''}`
      : null;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ version, defaultLanguageIsoCode, country, language }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error getting shop info: ${(error as Error).message}`,
        },
      ],
    };
  }
}
