import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { ProductContractStandard, ProductType } from '@unchainedshop/core-products';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import type { UnchainedCore } from '@unchainedshop/core';
import { TicketEventProperty } from '@unchainedshop/ticketing';
import { TICKET_WAREHOUSING_ADAPTER_KEY } from '@unchainedshop/ticketing/warehousing/ticket';

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

    // Gate staff sign in with a regular account that has the `ticketing` role (scanTicket).
    await modules.users.createUser(
      {
        email: 'gate@unchained.local',
        guest: false,
        initialPassword: seedPassword ? true : undefined,
        password: seedPassword ? seedPassword : undefined,
        roles: ['ticketing'],
        username: 'gate',
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
    });

    // The ticket issuer: the only VIRTUAL provider, a second one (e.g. the ETH minter) would
    // issue every ticket twice. initialConfiguration only applies to providers created through
    // GraphQL or the Admin UI, so a seed sets the configuration itself. Gates open 2 hours before
    // the event start and close 1 hour after it; an empty value leaves that side open.
    const warehousingProvider = await modules.warehousing.create({
      adapterKey: TICKET_WAREHOUSING_ADAPTER_KEY,
      type: WarehousingProviderType.VIRTUAL,
      configuration: [
        { key: 'entryOpensMinutesBefore', value: '120' },
        { key: 'entryClosesMinutesAfter', value: '60' },
        { key: 'serialOffset', value: '0' },
      ],
    });

    // A demo event starting one hour after the first boot, so its gate is open right away.
    // The event facts live in the public tokenization properties (see TicketEventProperty);
    // change them in the Admin UI (Ticketing → Events) or with the updateTicketEvent mutation.
    const startsAt = new Date(Date.now() + 60 * 60 * 1000);
    startsAt.setSeconds(0, 0);
    const event = await modules.products.create({
      type: ProductType.TOKENIZED_PRODUCT,
      tags: ['example-event'],
      commerce: {
        pricing: [
          {
            amount: 2500,
            currencyCode: currencies[0],
            countryCode: countries[0],
            isTaxable: false,
            isNetPrice: false,
          },
        ],
      },
      // Off-chain tickets need no contract address or token id; supply caps the tickets sold.
      tokenization: {
        contractStandard: ProductContractStandard.ERC721,
        supply: 500,
        ercMetadataProperties: {
          [TicketEventProperty.START]: startsAt,
          [TicketEventProperty.LOCATION]: 'Unchained Hall, Zurich',
          [TicketEventProperty.DURATION_MINUTES]: 120,
          [TicketEventProperty.DOORS_OPEN_MINUTES_BEFORE]: 30,
          [TicketEventProperty.CATEGORY]: 'Concert',
        },
      },
    });
    await modules.products.texts.updateTexts(event._id, [
      {
        locale: languages[0],
        title: 'Unchained Live',
        subtitle: 'An evening of commerce and music',
        slug: 'unchained-live',
      },
    ]);
    await modules.products.publish(event);

    logger.log(`initialized database with
countries: ${countries.join(',')}
currencies: ${currencies.join(',')}
languages: ${languages.join(',')}
deliveryProvider: ${deliveryProvider._id} (${deliveryProvider.adapterKey})
paymentProvider: ${paymentProvider._id} (${paymentProvider.adapterKey})
warehousingProvider: ${warehousingProvider._id} (${warehousingProvider.adapterKey})
event: ${event._id} (starts ${startsAt.toISOString()})
users: admin@unchained.local, gate@unchained.local / ${seedPassword}`);
  } catch (e) {
    logger.error(e);
  }
};
