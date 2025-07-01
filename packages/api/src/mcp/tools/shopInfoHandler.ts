import { Context } from '../../context.js';
import { log } from '@unchainedshop/logger';

export async function shopInfoHandler(context: Context) {
  const { version, userId, loaders, locale, countryCode } = context;

  try {
    log('query shopInfo', { userId });

    const language = await loaders.languageLoader.load({ isoCode: locale.language });

    const country = await loaders.countryLoader.load({ isoCode: countryCode });
    const defaultLanguageIsoCode = language.isoCode + '-' + country.isoCode;

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
