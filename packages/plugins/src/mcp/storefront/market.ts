import { resolveDefaultContext, type Context, type UnchainedLocaleContext } from '@unchainedshop/api';

export type StorefrontMarket = UnchainedLocaleContext;

export async function resolveStorefrontMarket(
  context: Context,
  hints: Record<string, any> = {},
): Promise<StorefrontMarket> {
  const { locale, countryCode, currencyCode } = context;
  const hintedLanguage = hints['openai/locale'];
  const hintedCountry = context.getHeader('x-shop-country')
    ? undefined
    : hints['openai/userLocation']?.country?.toUpperCase();
  if (!hintedLanguage && !hintedCountry) return { locale, countryCode, currencyCode };

  const acceptLang = hintedLanguage || locale.baseName;
  const market = await resolveDefaultContext(
    { acceptLang, acceptCountry: hintedCountry || countryCode },
    context,
  );
  if (!hintedCountry || market.countryCode === hintedCountry) return market;
  return resolveDefaultContext({ acceptLang, acceptCountry: countryCode }, context);
}
