import { resolveBestCurrency } from '@unchainedshop/utils';
import { User, UsersModule } from '@unchainedshop/core-users';
import { ordersSettings, OrdersModule } from '@unchainedshop/core-orders';
import { CountriesModule } from '@unchainedshop/core-countries';
import { CurrenciesModule } from '@unchainedshop/core-currencies';
import { DeliveryModule } from '@unchainedshop/core-delivery';
import { PaymentModule } from '@unchainedshop/core-payment';
import { initCartProvidersService } from './initCartProviders.js';

export const nextUserCartService = async (
  {
    user,
    orderNumber,
    countryCode,
    forceCartCreation,
  }: {
    user: User;
    orderNumber?: string;
    countryCode?: string;
    forceCartCreation?: boolean;
  },
  unchainedAPI: {
    modules: {
      orders: OrdersModule;
      countries: CountriesModule;
      currencies: CurrenciesModule;
      users: UsersModule;
      delivery: DeliveryModule;
      payment: PaymentModule;
    };
  },
) => {
  const { modules } = unchainedAPI;

  const cart = await modules.orders.cart({
    countryContext: countryCode || user.lastLogin?.countryCode,
    orderNumber,
    userId: user._id,
  });
  if (cart) return cart;

  const shouldCreateNewCart = forceCartCreation || ordersSettings.ensureUserHasCart;
  if (!shouldCreateNewCart) return null;

  const countryObject = await modules.countries.findCountry({ isoCode: countryCode });
  const currencies = await modules.currencies.findCurrencies({ includeInactive: false });
  const currency = resolveBestCurrency(countryObject.defaultCurrencyCode, currencies);

  const order = await modules.orders.create({
    userId: user._id,
    orderNumber,
    currency,
    countryCode,
    billingAddress: user.lastBillingAddress || user.profile?.address,
    contact:
      user.lastContact ||
      (!user.guest
        ? {
            telNumber: user.profile?.phoneMobile,
            emailAddress: modules.users.primaryEmail(user)?.address,
          }
        : {}),
  });

  return initCartProvidersService(order, unchainedAPI);
};
