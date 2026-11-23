import { resolveDefaultContext, type Context, type UnchainedLocaleContext } from '@unchainedshop/api';

export type StorefrontMarket = UnchainedLocaleContext;

export async function resolveStorefrontMarket(
  context: Context,
  hints: Record<string, any> = {},
  request?: Request,
): Promise<StorefrontMarket> {
  const header = (name: string) => request?.headers.get(name) || context.getHeader(name) || undefined;
  const acceptLang = hints['openai/locale'] || header('accept-language');
  const country = (header('x-shop-country') || hints['openai/userLocation']?.country)?.toUpperCase();

  if (country) {
    const market = await resolveDefaultContext({ acceptLang, acceptCountry: country }, context);
    if (market.countryCode === country) return market;
  }
  const { countryCode } = await resolveDefaultContext(
    { acceptLang: undefined, acceptCountry: undefined },
    context,
  );
  return resolveDefaultContext({ acceptLang, acceptCountry: countryCode }, context);
}
