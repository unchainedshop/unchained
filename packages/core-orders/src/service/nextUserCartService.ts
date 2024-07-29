import { User } from '@unchainedshop/core-users';
import { ordersSettings } from '../orders-settings.js';
import { resolveBestCurrency } from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/core';
import { Order } from '../types.js';

export type NextUserCartService = (
  params: {
    user: User;
    orderNumber?: string;
    countryCode?: string;
    forceCartCreation?: boolean;
  },
  unchainedAPI: UnchainedCore,
) => Promise<Order | null>;

export const nextUserCartService: NextUserCartService = async (
  { user, orderNumber, countryCode, forceCartCreation },
  unchainedAPI,
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

  return modules.orders.initProviders(order, unchainedAPI);
};
