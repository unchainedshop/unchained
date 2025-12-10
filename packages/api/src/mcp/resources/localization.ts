import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '../../context.ts';

export const registerLocalizationResources = (server: McpServer, context: Context) => {
  server.resource(
    'shop-languages',
    'unchained://shop/languages',
    {
      description:
        'Available languages configured in the shop. Use these ISO codes when creating or updating products, filters, and assortments. Includes valid language-country dialect combinations.',
      mimeType: 'application/json',
    },
    async () => {
      const [languages, countries] = await Promise.all([
        context.modules.languages.findLanguages({ includeInactive: false }),
        context.modules.countries.findCountries({ includeInactive: false }),
      ]);

      const baseLanguageCodes = languages.map((l) => l.isoCode.toLowerCase());
      const availableCountryCodes = countries.map((c) => c.isoCode.toUpperCase());

      return {
        contents: [
          {
            uri: 'unchained://shop/languages',
            mimeType: 'application/json',
            text: JSON.stringify(
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
            ),
          },
        ],
      };
    },
  );

  server.resource(
    'shop-currencies',
    'unchained://shop/currencies',
    {
      description:
        'Available currencies configured in the shop. Check decimal points for price conversions. All prices are stored as integers.',
      mimeType: 'application/json',
    },
    async () => {
      const currencies = await context.modules.currencies.findCurrencies({ includeInactive: false });
      return {
        contents: [
          {
            uri: 'unchained://shop/currencies',
            mimeType: 'application/json',
            text: JSON.stringify(
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
            ),
          },
        ],
      };
    },
  );
  server.resource(
    'shop-countries',
    'unchained://shop/countries',
    {
      description:
        'Available countries configured in the shop. Use these ISO codes for geographic operations.',
      mimeType: 'application/json',
    },
    async () => {
      const countries = await context.modules.countries.findCountries({ includeInactive: false });
      return {
        contents: [
          {
            uri: 'unchained://shop/countries',
            mimeType: 'application/json',
            text: JSON.stringify(
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
            ),
          },
        ],
      };
    },
  );
};
