import type { McpServer } from '@modelcontextprotocol/server';
import type { Context } from '../../context.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:mcp');

export async function getShopLanguagesText(context: Context): Promise<string> {
  const [languages, countries] = await Promise.all([
    context.modules.languages.findLanguages({ includeInactive: false }),
    context.modules.countries.findCountries({ includeInactive: false }),
  ]);

  const baseLanguageCodes = languages.map((l) => l.isoCode.toLowerCase());
  const availableCountryCodes = countries.map((c) => c.isoCode.toUpperCase());

  return JSON.stringify(
    {
      baseLanguages: languages.map((l) => ({
        isoCode: l.isoCode,
        name: l.isoCode,
        isActive: l.isActive,
      })),
      availableCountries: availableCountryCodes,
      localeFormat:
        'Use base language codes (e.g., "en", "fr", "de") or language-country combinations (e.g., "en-US", "fr-CH") following BCP 47 format',
      validationRule: `Any combination of base languages [${baseLanguageCodes.join(', ')}] with available countries [${availableCountryCodes.join(', ')}] is acceptable for locale codes, as long as it makes contextual sense (e.g., "en-US" , "de-CH" , but "ja-DE" would be unusual)`,
      note: 'If a required base language is missing, ask the user if they want to add it using localization_management tool with action: CREATE',
    },
    null,
    2,
  );
}

export async function getShopCurrenciesText(context: Context): Promise<string> {
  const currencies = await context.modules.currencies.findCurrencies({ includeInactive: false });
  return JSON.stringify(
    {
      currencies: currencies.map((c) => ({
        isoCode: c.isoCode,
        name: c.isoCode,
        isActive: c.isActive,
        decimals: c.decimals,
      })),
      note: 'If a required currency is missing, ask the user if they want to add it using localization_management tool with action: CREATE',
    },
    null,
    2,
  );
}

export async function getShopCountriesText(context: Context): Promise<string> {
  const countries = await context.modules.countries.findCountries({ includeInactive: false });
  return JSON.stringify(
    {
      countries: countries.map((c) => ({
        isoCode: c.isoCode,
        name: c.isoCode,
        isActive: c.isActive,
      })),
      note: 'If a required country is missing, ask the user if they want to add it using localization_management tool with action: CREATE',
    },
    null,
    2,
  );
}

// Builds the shop-configuration block the chat handlers append to their system prompt.
// Reads the same data the MCP resources serve, but in-process — no MCP client roundtrip.
// Mirrors the /mcp auth wall: resources used to be fetched over loopback THROUGH the
// 401/403 admin guard, so non-admin (or absent) contexts get nothing here either.
export async function buildChatResourceContext(context: Context | undefined): Promise<string> {
  if (!context?.user?.roles?.includes('admin')) return '';

  const sections = await Promise.all(
    (
      [
        ['shop-languages', getShopLanguagesText],
        ['shop-currencies', getShopCurrenciesText],
        ['shop-countries', getShopCountriesText],
      ] as const
    ).map(async ([name, getText]) => {
      try {
        return `${name}:\n${await getText(context)}`;
      } catch (error) {
        logger.error(`Failed to read resource ${name}: ${(error as Error).message}`);
        return null;
      }
    }),
  );

  const body = sections.filter(Boolean).join('\n\n');
  return body ? `\n\nAVAILABLE SHOP CONFIGURATION:\n${body}` : '';
}

export const registerLocalizationResources = (server: McpServer, context: Context) => {
  server.registerResource(
    'shop-languages',
    'unchained://shop/languages',
    {
      description:
        'Available languages configured in the shop. Use these ISO codes when creating or updating products, filters, and assortments. Includes valid language-country dialect combinations.',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'unchained://shop/languages',
          mimeType: 'application/json',
          text: await getShopLanguagesText(context),
        },
      ],
    }),
  );

  server.registerResource(
    'shop-currencies',
    'unchained://shop/currencies',
    {
      description:
        'Available currencies configured in the shop. Check decimal points for price conversions. All prices are stored as integers.',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'unchained://shop/currencies',
          mimeType: 'application/json',
          text: await getShopCurrenciesText(context),
        },
      ],
    }),
  );

  server.registerResource(
    'shop-countries',
    'unchained://shop/countries',
    {
      description:
        'Available countries configured in the shop. Use these ISO codes for geographic operations.',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'unchained://shop/countries',
          mimeType: 'application/json',
          text: await getShopCountriesText(context),
        },
      ],
    }),
  );
};
