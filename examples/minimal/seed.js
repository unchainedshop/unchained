import { Users } from 'meteor/unchained:core-users';
import { Currencies } from 'meteor/unchained:core-currencies';
import { Countries } from 'meteor/unchained:core-countries';
import { Languages } from 'meteor/unchained:core-languages';
import { hashPassword } from 'meteor/unchained:api';

const logger = console;

export default async () => {
  try {
    if (Users.find({ username: 'admin' }).count() > 0) {
      return;
    }
    const admin = await Users.createUser({
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
    });

    const languages = ['de', 'fr'].map((code) => {
      const language = Languages.createLanguage({
        isoCode: code,
        isActive: true,
        authorId: admin._id,
      });
      return language.isoCode;
    });
    const currencies = ['EUR'].map((code) => {
      const currency = Currencies.createCurrency({
        isoCode: code,
        isActive: true,
        authorId: admin._id,
      });
      return currency;
    });
    const countries = ['CH'].map((code, key) => {
      const country = Countries.createCountry({
        isoCode: code,
        isActive: true,
        authorId: admin._id,
        defaultCurrencyId: currencies[key]._id,
      });
      return country.isoCode;
    });
    logger.log(`
      initialized database with
      \ncountries: ${countries.join(',')}
      \ncurrencies: ${currencies.map((c) => c.isoCode).join(',')}
      \nlanguages: ${languages.join(',')}
      \nuser: admin@unchained.local / password`);
  } catch (e) {
    logger.error(e);
  }
};
