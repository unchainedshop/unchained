import { NextUserCartService } from '@unchainedshop/types/orders.js';
import { ordersSettings } from '../orders-settings.js';

export const nextUserCartService: NextUserCartService = async (
  { user, orderNumber, countryCode, forceCartCreation },
  unchainedAPI,
) => {
  const { modules, services } = unchainedAPI;

  const cart = await modules.orders.cart({
    countryContext: countryCode || user.lastLogin?.countryCode,
    orderNumber,
    userId: user._id,
  });
  if (cart) return cart;

  const shouldCreateNewCart = forceCartCreation || !ordersSettings.ensureUserHasCart;
  if (!shouldCreateNewCart) return null;

  const currency = await services.countries.resolveDefaultCurrencyCode(
    {
      isoCode: countryCode,
    },
    unchainedAPI,
  );

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
