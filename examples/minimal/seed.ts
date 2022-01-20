import { hashPassword } from "meteor/unchained:api";
import { DeliveryProviderType } from "meteor/unchained:core-delivery";
import { PaymentProviderType } from "meteor/unchained:core-payment";
import { v4 as uuidv4 } from "uuid";
import { Context } from "@unchainedshop/types/api";

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
  UNCHAINED_SEED_PASSWORD === "generate"
    ? uuidv4().split("-").pop()
    : UNCHAINED_SEED_PASSWORD;

export default async (unchainedApi: Context) => {
  const { modules, userId } = unchainedApi;
  try {
    if ((await modules.users.count({ username: "admin" })) > 0) {
      return;
    }
    const adminId = await modules.accounts.createUser(
      {
        username: "admin",
        roles: ["admin"],
        email: "admin@unchained.local",
        password: seedPassword ? hashPassword(seedPassword) : undefined,
        initialPassword: seedPassword ? true : undefined,
        profile: { address: {} },
        guest: false,
        lastBillingAddress: {},
      },
      { skipMessaging: true }
    );

    const languages = await Promise.all(
      [UNCHAINED_LANG ? UNCHAINED_LANG.toLowerCase() : "de"].map(
        async (code) => {
          const languageId = await modules.languages.create(
            {
              isoCode: code,
              isActive: true,
              authorId: adminId,
            },
            adminId
          );
          const language = await modules.languages.findLanguage({ languageId });
          return language.isoCode;
        }
      )
    );

    const currencies = await Promise.all(
      [UNCHAINED_CURRENCY ? UNCHAINED_CURRENCY.toUpperCase() : "CHF"].map(
        async (code) => {
          const currencyId = await modules.currencies.create(
            {
              isoCode: code,
              isActive: true,
              authorId: adminId,
            },
            adminId
          );
          const currency = await modules.currencies.findCurrency({
            currencyId,
          });
          return currency;
        }
      )
    );

    const countries = await Promise.all(
      [UNCHAINED_COUNTRY ? UNCHAINED_COUNTRY.toUpperCase() : "CH"].map(
        async (code, key) => {
          const countryId = await modules.countries.create(
            {
              isoCode: code,
              isActive: true,
              authorId: adminId,
              defaultCurrencyId: currencies[key]._id,
            },
            adminId
          );
          const country = await modules.countries.findCountry({ countryId });
          return country.isoCode;
        }
      )
    );

    const deliveryProviderId = await modules.delivery.create(
      {
        adapterKey: "shop.unchained.delivery.send-message",
        type: DeliveryProviderType.SHIPPING,
        configuration: [
          {
            key: "from",
            value: EMAIL_FROM || "hello@unchained.local",
          },
          {
            key: "to",
            value: UNCHAINED_MAIL_RECIPIENT || "orders@unchained.local",
          },
          // {
          //   from: EMAIL_FROM || "hello@unchained.local",
          //   to: UNCHAINED_MAIL_RECIPIENT || "orders@unchained.local",
          // },
        ],
        created: new Date(),
        authorId: adminId,
      },
      adminId
    );
    const deliveryProvider = await modules.delivery.findProvider({
      deliveryProviderId,
    });

    const paymentProviderId = await modules.payment.paymentProviders.create(
      {
        adapterKey: "shop.unchained.invoice",
        type: PaymentProviderType.INVOICE,
        configuration: [],
        created: new Date(),
        authorId: adminId,
      },
      adminId
    );
    const paymentProvider = await modules.payment.paymentProviders.findProvider(
      { paymentProviderId }
    );

    logger.log(`
      initialized database with
      \ncountries: ${countries.join(",")}
      \ncurrencies: ${currencies.map((c) => c.isoCode).join(",")}
      \nlanguages: ${languages.join(",")}
      \ndeliveryProvider: ${deliveryProviderId} (${
      deliveryProvider.adapterKey
    })\npaymentProvider: ${paymentProviderId} (${paymentProvider.adapterKey})
      \nuser: admin@unchained.local / ${seedPassword}`);
  } catch (e) {
    logger.error(e);
  }
};