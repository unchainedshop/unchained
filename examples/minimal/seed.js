import { Users } from 'meteor/unchained:core-users';
import { Currencies } from 'meteor/unchained:core-currencies';
import { Countries } from 'meteor/unchained:core-countries';
import { Languages } from 'meteor/unchained:core-languages';
import { hashPassword } from 'meteor/unchained:api';
import {
  DeliveryProviders,
  DeliveryProviderType,
} from 'meteor/unchained:core-delivery';
import {
  PaymentProviders,
  PaymentProviderType,
} from 'meteor/unchained:core-payment';

const logger = console;
const {
  UNCHAINED_COUNTRY,
  UNCHAINED_CURRENCY,
  UNCHAINED_LANG,
  UNCHAINED_MAIL_RECIPIENT,
  EMAIL_FROM,
} = process.env;

export default async () => {
  try {
    if (Users.find({ username: 'admin' }).count() > 0) {
      return;
    }
    const admin = await Users.createUser(
      {
        username: 'admin',
        roles: ['admin'],
        email: 'admin@unchained.local',
        password: hashPassword('password'),
        initialPassword: true,
        profile: { address: {} },
        guest: false,
        lastBillingAddress: {
          firstName: 'Caraig Jackson',
          lastName: 'Mengistu',
          company: 'false',
          postalCode: '52943',
          countryCode: 'ET',
          city: 'Addis Ababa',
          addressLine: '75275 Bole Mikael',
          addressLine2: 'Bole 908',
          regionCode: 'false',
        },
      },
      {},
      { skipMessaging: true },
    );
    const languages = [
      UNCHAINED_LANG ? UNCHAINED_LANG.toLowerCase() : 'de',
    ].map((code) => {
      const language = Languages.createLanguage({
        isoCode: code,
        isActive: true,
        authorId: admin._id,
      });
      return language.isoCode;
    });
    const currencies = [
      UNCHAINED_CURRENCY ? UNCHAINED_CURRENCY.toUpperCase() : 'CHF',
    ].map((code) => {
      const currency = Currencies.createCurrency({
        isoCode: code,
        isActive: true,
        authorId: admin._id,
      });
      return currency;
    });
    const countries = [
      UNCHAINED_COUNTRY ? UNCHAINED_COUNTRY.toUpperCase() : 'CH',
    ].map((code, key) => {
      const country = Countries.createCountry({
        isoCode: code,
        isActive: true,
        authorId: admin._id,
        defaultCurrencyId: currencies[key]._id,
      });
      return country.isoCode;
    });
    const deliveryProvider = DeliveryProviders.createProvider({
      adapterKey: 'shop.unchained.delivery.send-message',
      type: DeliveryProviderType.SHIPPING,
      configuration: [
        {
          from: EMAIL_FROM || 'hello@unchained.local',
          to: UNCHAINED_MAIL_RECIPIENT || 'orders@unchained.local',
        },
      ],
      created: new Date(),
      authorId: admin._id,
    });
    const paymentProvider = PaymentProviders.createProvider({
      adapterKey: 'shop.unchained.invoice',
      type: PaymentProviderType.INVOICE,
      configuration: [],
      created: new Date(),
      authorId: admin._id,
    });
    logger.log(`
      initialized database with
      \ncountries: ${countries.join(',')}
      \ncurrencies: ${currencies.map((c) => c.isoCode).join(',')}
      \nlanguages: ${languages.join(',')}
      \ndeliveryProvider: ${deliveryProvider._id} (${
      deliveryProvider.adapterKey
    })\npaymentProvider: ${paymentProvider._id} (${paymentProvider.adapterKey})
      \nuser: admin@unchained.local / password`);
  } catch (e) {
    logger.error(e);
  }
};
