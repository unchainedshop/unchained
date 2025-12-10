import type { Context } from '../../../../context.ts';

const getShopInfo = async ({ loaders, countryCode, locale, version }: Context) => {
  const language = await loaders.languageLoader.load({ isoCode: locale.language });
  const country = await loaders.countryLoader.load({ isoCode: countryCode });
  const defaultLanguageIsoCode = language?.isoCode
    ? `${language.isoCode}${country?.isoCode ? '-' + country.isoCode : ''}`
    : null;

  return {
    version,
    defaultLanguageIsoCode,
    country,
    language,
    countryCode,
    locale,
  };
};

export default getShopInfo;
