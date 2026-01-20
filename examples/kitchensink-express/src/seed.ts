import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import type { UnchainedCore } from '@unchainedshop/core';

const logger = console;
const {
  UNCHAINED_COUNTRY,
  UNCHAINED_CURRENCY,
  UNCHAINED_LANG,
  UNCHAINED_MAIL_RECIPIENT,
  UNCHAINED_SEED_PASSWORD,
  EMAIL_FROM,
} = process.env;

const seedPassword =
  UNCHAINED_SEED_PASSWORD === 'generate'
    ? crypto.randomUUID().split('-').pop()
    : UNCHAINED_SEED_PASSWORD;

export default async (unchainedAPI: UnchainedCore) => {
  const { modules } = unchainedAPI;
  try {
    if ((await modules.users.count({ username: 'admin' })) > 0) {
      return;
    }
    await modules.users.createUser(
      {
        email: 'admin@unchained.local',
        guest: false,
        initialPassword: seedPassword ? true : undefined,
        password: seedPassword ? seedPassword : undefined,
        roles: ['admin'],
        username: 'admin',
      },
      { skipMessaging: true },
    );

    const languages = await Promise.all(
      [UNCHAINED_LANG ? UNCHAINED_LANG.toLowerCase() : 'de'].map(async (code) => {
        const languageId = await modules.languages.create({
          isoCode: code,
          isActive: true,
        });
        const language = await modules.languages.findLanguage({ languageId });
        return language.isoCode;
      }),
    );

    const currencies = await Promise.all(
      [UNCHAINED_CURRENCY ? UNCHAINED_CURRENCY.toUpperCase() : 'CHF'].map(async (code) => {
        const currencyId = await modules.currencies.create({
          isoCode: code,
          isActive: true,
        });
        const currency = await modules.currencies.findCurrency({
          currencyId,
        });
        return currency.isoCode;
      }),
    );

    const countries = await Promise.all(
      [UNCHAINED_COUNTRY ? UNCHAINED_COUNTRY.toUpperCase() : 'CH'].map(async (code, key) => {
        const countryId = await modules.countries.create({
          isoCode: code,
          isActive: true,
          defaultCurrencyCode: currencies[key],
        });
        const country = await modules.countries.findCountry({ countryId });
        return country.isoCode;
      }),
    );

    const deliveryProvider = await modules.delivery.create({
      adapterKey: 'shop.unchained.delivery.send-message',
      type: DeliveryProviderType.SHIPPING,
      configuration: [
        {
          key: 'from',
          value: EMAIL_FROM || 'hello@unchained.local',
        },
        {
          key: 'to',
          value: UNCHAINED_MAIL_RECIPIENT || 'orders@unchained.local',
        },
      ],
    });

    const paymentProvider = await modules.payment.paymentProviders.create({
      adapterKey: 'shop.unchained.invoice',
      type: PaymentProviderType.INVOICE,
      configuration: [],
      created: new Date(),
    });

    logger.log(`initialized database with
countries: ${countries.join(',')}
currencies: ${currencies.join(',')}
languages: ${languages.join(',')}
deliveryProvider: ${deliveryProvider._id} (${deliveryProvider.adapterKey})
paymentProvider: ${
  paymentProvider._id
} (${paymentProvider.adapterKey})
user: admin@unchained.local / ${seedPassword}`);
  } catch (e) {
    logger.error(e);
  }
};
